export class ValidatedMethod {
    #callback = () => {};
    #args = {};

    static #quiet = false;

    static get quiet() {
        return this.#quiet;
    }

    static set quiet(value) {
        this.#quiet = !!value;
    }

    constructor(args, callback, returnType) {
        // Handle zero-parameter case
        if (args === undefined || args === null || args === 'void' || 
            (Array.isArray(args) && args.length === 0)) {
            this.#args = { 
                _values: [],
                _isArraySchema: true 
            };
            this.#callback = (opts) => callback();
        }
        // Handle string type, array of types, or custom type for unnamed parameters
        else if (typeof args === 'string' || Array.isArray(args) || typeof args === 'function') {
            const types = Array.isArray(args) ? args : [args];
            this.#args = { 
                _values: types,
                _isArraySchema: true 
            };
            this.#callback = (opts) => callback(...opts._values);
        }
        else if (typeof args !== 'object') {
            throw new TypeError('Arguments must be an object, string type, array of types, or class constructor');
        } else {
            // Original object parameter case
            if (typeof args !== 'object') {
                throw new TypeError('Arguments must be an object, string type, or array of types');
            }
            this.#args = args;
            this.#callback = callback;
        }

        // Wrap callback to validate return type if specified
        const wrappedCallback = returnType ? (opts) => {
            const result = this.#callback(opts);
            
            // Handle Promise return types
            if (result instanceof Promise) {
                return result.then(value => {
                    this.#validateReturn(value, returnType);
                    return value;
                });
            }
            
            this.#validateReturn(result, returnType);
            return result;
        } : this.#callback;

        // Return a bound function that validates and calls
        return Object.assign(
            (...params) => {
                // Handle array schema case
                if (this.#args._isArraySchema) {
                    const opts = { _values: params };
                    if (this.#validate(opts, this.#args)) {
                        return wrappedCallback(opts);
                    }
                }
                // Handle single parameter case
                else if (typeof this.#args.value === 'string' && Object.keys(this.#args).length === 1) {
                    const opts = { value: params[0] };
                    if (this.#validate(opts, this.#args)) {
                        return wrappedCallback(opts);
                    }
                }
                // Handle original object case
                else {
                    if (this.#validate(params[0], this.#args)) {
                        return wrappedCallback(params[0] || {});
                    }
                }
            },
            { originalMethod: this }
        );
    }

    #validateNumber(value, key, strict = false) {
        if (strict && typeof value !== 'number') {
            throw new TypeError(`Expected number, got ${typeof value} for ${key}`);
        }
        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new TypeError(`Cannot convert ${value} to number for ${key}`);
        }
        return num;
    }

    #validateInteger(value, key, type) {
        const num = this.#validateNumber(value, key, type === 'strictint');
        if (type === 'strictint' && !Number.isInteger(num)) {
            throw new TypeError(`Expected integer, got ${num} for ${key}`);
        }
        return type === 'roundint' ? Math.round(num) : Math.floor(num);
    }

    #validateArrayTypes(values, types) {
        // Handle zero parameter case
        if (types.length === 0) {
            if (values.length > 0) {
                throw new TypeError(`Expected 0 arguments, got ${values.length}`);
            }
            return;
        }

        // Check argument count
        if (values.length < types.length) {
            throw new TypeError(`Expected ${types.length} arguments, got ${values.length}`);
        }

        // Validate each argument type
        types.forEach((type, index) => {
            let value = values[index];
            
            // Replace the validator function detection with:
            if (typeof type === 'function') {
                // Check if it's a class constructor by testing if prototype is writable
                const isClass = Object.getOwnPropertyDescriptor(type, 'prototype')?.writable === false;
                
                if (!isClass) {
                    // Handle validator function - use truthy/falsey evaluation
                    try {
                        const result = type(value);
                        
                        // Handle potential async validator
                        if (result instanceof Promise) {
                            throw new TypeError('Validator functions must be synchronous');
                        }
                        
                        // Use standard JavaScript truthy/falsy evaluation
                        if (!result) {
                            throw new TypeError(`Argument ${index}: Value "${value}" failed validation`);
                        }
                        return;
                    } catch (e) {
                        // Propagate validator errors with proper context
                        throw new TypeError(`Validator failed: ${e.message}`);
                    }
                }
                // Handle class constructor
                if (!(value instanceof type)) {
                    throw new TypeError(`Argument ${index}: Expected ${type.name}, got ${value?.constructor?.name || typeof value}`);
                }
                return;
            }

            if (['int', 'roundint', 'strictint'].includes(type)) {
                values[index] = this.#validateInteger(value, `Argument ${index}`, type);
                return;
            }
            
            if (typeof type === 'string' && typeof value !== type) {
                throw new TypeError(`Argument ${index}: Expected ${type}, got ${typeof value}`);
            }
        });
    }

    #validate(opts, schema) {
        if (schema._isArraySchema) {
            this.#validateArrayTypes(opts._values, schema._values);
            return true;
        }

        // Check if all parameters are optional
        const allOptional = Object.values(schema).every(v => 
            v === 'optional' || 
            (Array.isArray(v) && v.includes('optional'))
        );

        // Allow undefined/null opts if all params are optional
        if (!opts && allOptional) {
            return true;
        }

        // Add null/undefined check
        if (!opts || typeof opts !== 'object') {
            throw new TypeError('Parameters must be provided as an object');
        }

        // Check for extra parameters first
        for (const key of Object?.keys(opts)) {
            if (!schema.hasOwnProperty(key)) {
                if (ValidatedMethod.quiet) continue;
                console.warn(`Unexpected parameter: ${key}`);
            }
        }

        // Validate all required parameters exist and match types
        for (const [key, validator] of Object.entries(schema)) {
            const value = opts[key];

            // Handle array-based validators
            if (Array.isArray(validator)) {
                // Allow undefined if optional/undefined is in validators
                if (value === undefined && 
                    (validator.includes('optional') || validator.includes('undefined'))) {
                    continue;
                }
                
                // Skip null values
                if (value === null) continue;

                // For non-undefined values, check against allowed types
                // Filter out optional/undefined from type check
                const types = validator.filter(v => v !== 'optional' && v !== 'undefined');
                if (!types.includes(typeof value)) {
                    throw new TypeError(`Expected one of [${types}], got ${typeof value} for ${key}`);
                }
                continue;
            }

            // Check optional first
            if (validator === 'optional') {
                continue;
            }

            // Handle optional parameters (null allowed)
            if (Array.isArray(validator)) {
                if (value === null) continue;
                if (!validator.includes(typeof value)) {
                    throw new TypeError(`Expected one of [${validator}], got ${typeof value} for ${key}`);
                }
                continue;
            }

            // Check for required parameters
            if (value === undefined) {
                throw new TypeError(`Missing required parameter: ${key}`);
            }

            // Type validation
            if (validator === 'any') {
                if (value === undefined) {
                    throw new TypeError(`Parameter ${key} cannot be undefined, use 'optional' for that`);
                }
                continue;
            } else if (validator === 'array') {
                if (!Array.isArray(value)) { 
                    throw new TypeError(`Expected Array, got ${typeof value} for ${key}`); 
                }
            } else if (typeof validator === 'function' && !validator.prototype) {
                // Handle validator function
                if (!validator(value)) {
                    throw new TypeError(`Value "${value}" failed validation for ${key}`);
                }
            } else if (typeof validator === 'function' && !(value instanceof validator)) {
                throw new TypeError(`Expected instance of ${validator.name}, got ${typeof value} for ${key}`);
            } else if (validator === 'strictboolean') {
                if (typeof value !== 'boolean') {
                    throw new TypeError(`Expected boolean, got ${typeof value} for ${key}`);
                }
            } else if (validator === 'boolean') {
                opts[key] = Boolean(value);  // Coerce to boolean
            } else if (validator === 'strictint' || validator === 'int' || validator === 'roundint') {
                opts[key] = this.#validateInteger(value, key, validator);
            } else if (validator === 'strictfloat' || validator === 'float' || validator === 'number') {
                opts[key] = this.#validateNumber(value, key, validator === 'strictfloat');
            } else if (typeof validator === 'string' && typeof value !== validator) {
                throw new TypeError(`Expected ${validator}, got ${typeof value} for ${key}`);
            } else if (validator instanceof RegExp) {
                // Handle unconvertible values first
                if (typeof value === 'symbol') {
                    throw new TypeError(`Cannot convert Symbol to string for ${key}`);
                }
                
                // Convert to string and test against regex
                const str = String(value);
                if (!validator.test(str)) {
                    throw new TypeError(`Value "${str}" does not match pattern ${validator} for ${key}`);
                }
                opts[key] = str; // Store converted value
            }
        }
        return true;
    }

    #validateReturn(value, type) {
        if (Array.isArray(type)) {
            // Handle array of allowed types
            const types = type.filter(t => t !== 'optional' && t !== 'undefined');
            if (value === undefined && type.includes('optional')) return;
            if (value === null && type.includes('null')) return;
            if (!types.some(t => this.#checkType(value, t))) {
                throw new TypeError(`Return value ${value} does not match any of [${types}]`);
            }
        } else {
            // Handle single type
            if (!this.#checkType(value, type)) {
                const typeName = typeof type === 'function' && !type.prototype 
                    ? 'custom validator'
                    : (typeof type === 'function' ? type.name : type);
                throw new TypeError(`Return value ${value} does not match type ${typeName}`);
            }
        }
    }

    #checkType(value, type) {
        // Add custom validator function support
        if (typeof type === 'function' && !type.prototype) {
            try {
                return type(value) === true;
            } catch (e) {
                throw new TypeError(`Custom validator failed: ${e.message}`);
            }
        }
        
        // Handle class constructors
        if (typeof type === 'function') {
            return value instanceof type;
        }

        // Special handling for void type
        if (type === 'void') {
            return value === undefined;
        }
        
        // Special handling for undefined type
        if (type === 'undefined') {
            return value === undefined;
        }

        // All non-void types should reject undefined
        if (value === undefined) {
            return false;
        }

        // Handle any type - allows everything except undefined
        if (type === 'any') {
            return true;
        }

        if (type === 'array') return Array.isArray(value);
        if (typeof type === 'function') return value instanceof type;
        if (type === 'strictboolean') return typeof value === 'boolean';
        if (type === 'boolean') return typeof value === 'boolean' || [0,1,'true','false'].includes(value);
        if (['int', 'roundint', 'strictint'].includes(type)) {
            try {
                this.#validateInteger(value, 'return', type);
                return true;
            } catch {
                return false;
            }
        }
        if (['number', 'float', 'strictfloat'].includes(type)) {
            try {
                this.#validateNumber(value, 'return', type === 'strictfloat');
                return true;
            } catch {
                return false;
            }
        }
        if (type instanceof RegExp) {
            try {
                return type.test(String(value));
            } catch {
                return false;
            }
        }
        return typeof value === type;
    }
}

export function _$(a, c, r) {
    return new ValidatedMethod(a, c, r);
}