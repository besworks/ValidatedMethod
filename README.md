# ValidatedMethod
Provides runtime type checking for JavaScript function parameters similar to TypeScript, but with no compiling or dependencies. 

## Features
- Zero dependencies
- TypeScript-like parameter validation in pure JavaScript
- Coercion options for numbers and booleans
- Async/Promise support
- Clean, declarative syntax
- Custom type support
- Extra parameter warnings
- Easy to integrate

## Usage

```javascript
import { ValidatedMethod } from './validated-method.js';

class UserService {
    createUser = new ValidatedMethod({
        username: 'string',
        age: 'number',
        active: 'boolean',
        roles: 'array',
        settings: 'object',
        email: ['string', 'null']
    }, async (opts) => {
        // Parameters are validated, safe to use
        return await db.users.create(opts);
    });
}
```

## Type Validation

### Basic Types
- `'string'` - String values
- `'boolean'` - Booleans with coercion (uses `Boolean()`)
- `'object'` - Object literals
- `'array'` - Arrays (uses `Array.isArray()`)
- `'any'` - Any type including null, except undefined
- `'optional'` - Optional parameter (can be undefined)

### Number Types
- `'int'` - Integers with truncating coercion (uses `parseInt()`)
- `'roundint'` - Integers with rounding coercion (uses `Math.round()`)
- `'strictint'` - Integers without coercion
- `'float'` - Floating point numbers with coercion (uses `parseFloat()`)
- `'number'` - Alias of `'float'`
- `'strictfloat'` - Floating point numbers without coercion

### Strict Boolean
- `'strictboolean'` - Booleans without coercion

### Custom Types
```javascript
class CustomType {
    constructor(value) {
        this.value = value;
    }
}

const method = new ValidatedMethod({
    instance: CustomType,           // Must be instance of CustomType
    mixed: [CustomType, 'object']  // Can be CustomType or plain object
}, (opts) => {
    // Implementation
});
```

## Extra Parameter Warnings

By default, ValidatedMethod warns about unexpected parameters:

```javascript
const method = new ValidatedMethod({
    name: 'string'
}, opts => opts);

method({
    name: 'test',
    extra: true  // Logs warning: "Unexpected parameter: extra"
});
```

### Quiet Mode
```javascript
const method = new ValidatedMethod({...}, callback);
method.quiet = true;  // Suppress unexpected parameter warnings
```

## Error Handling
Throws a `TypeError` for validation failures:

- Missing required parameters
- Type mismatches
- Coercion failures
- Invalid custom type instances
