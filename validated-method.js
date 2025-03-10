export class ValidatedMethod {
    #callback = () => {};
    #args = {};
    #quiet = false;

    get quiet() {
        return this.#quiet;
    }
    set quiet(value) {
        this.#quiet = !!value;
    }

    constructor(args, callback) {
        if (typeof args !== 'object') {
            throw new TypeError('Arguments must be an object');
        } this.#args = args;

        if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function');
        } this.#callback = callback;

        // Return a bound function that validates and calls
        return Object.assign(
            (opts) => {
                if (this.#validate(opts, this.#args)) {
                    return this.#callback(opts);
                }
            },
            { originalMethod: this }
        );
    }

    #validate(opts, schema) {
        // Check for extra parameters first
        for (const key of Object.keys(opts)) {
            if (!schema.hasOwnProperty(key)) {
                if (this.#quiet) continue;
                console.warn(`Unexpected parameter: ${key}`);
            }
        }

        // Validate all required parameters exist and match types
        for (const [key, validator] of Object.entries(schema)) {
            const value = opts[key];

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
            } else if (validator === 'strictint') {
                if (typeof value !== 'number' || !Number.isInteger(value)) {
                    throw new TypeError(`Expected integer, got ${value} for ${key}`);
                }
            } else if (validator === 'int') {
                const int = parseInt(value);
                if (isNaN(int)) {
                    throw new TypeError(`Cannot convert ${value} to integer for ${key}`);
                }
                opts[key] = int;  // Coerce to integer
            } else if (validator === 'roundint') {
                const float = parseFloat(value);
                if (isNaN(float)) {
                    throw new TypeError(`Cannot convert ${value} to integer for ${key}`);
                }
                opts[key] = Math.round(float); // Coerce to rounded integer
            } else if (validator === 'strictfloat') {
                if (typeof value !== 'number') {
                    throw new TypeError(`Expected number, got ${typeof value} for ${key}`);
                }
            } else if (validator === 'float' || validator === 'number') {
                const float = parseFloat(value);
                if (isNaN(float)) {
                    throw new TypeError(`Cannot convert ${value} to float for ${key}`);
                }
                opts[key] = float;  // Coerce to float
            } else if (typeof validator === 'string' && typeof value !== validator) {
                throw new TypeError(`Expected ${validator}, got ${typeof value} for ${key}`);
            }
        }
        return true;
    }
}