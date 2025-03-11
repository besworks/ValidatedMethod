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
        // Handle string type or array of types for unnamed parameters
        if (typeof args === 'string' || Array.isArray(args)) {
            const types = Array.isArray(args) ? args : [args];
            this.#args = { 
                _values: types,
                _isArraySchema: true 
            };
            this.#callback = (opts) => callback(...opts._values);
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
                        return wrappedCallback(params[0]);
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
        if (values.length < types.length) {
            throw new TypeError(`Expected ${types.length} arguments, got ${values.length}`);
        }

        types.forEach((type, index) => {
            let value = values[index];
            
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

        // Check for extra parameters first
        for (const key of Object.keys(opts)) {
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
                const typeName = typeof type === 'function' ? type.name : type;
                throw new TypeError(`Return value ${value} does not match type ${typeName}`);
            }
        }
    }

    #checkType(value, type) {
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