# ValidatedMethod
Provides runtime type checking for JavaScript function parameters similar to TypeScript, but with no compiling or dependencies. 

## Features
- Zero dependencies
- TypeScript-like parameter validation in pure JavaScript
- Named, single, and positional parameter support
- Coercion options for numbers and booleans
- RegExp validation for strings
- Custom type support
- Extra parameter warnings
- Optional return type validation
- Easy to integrate with intuitive syntax
- Supports async / Promsie chaining
- Full test suite included

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
        email: /^[^@]+@[^@]+\.[^@]+$/,
        birthday: ['string', 'optional']
        title: 'string'
    }, async (opts) => {
        // Parameters are validated, safe to use
        return await db.users.create(opts);
    });
}

const myService = new UserService();

myService.createUser({
    username: 'besworks',
    age: 40,
    active: true,
    roles: [ 'admin', 'wizard' ],
    settings: { darkmode: 'auto' },
    email: 'example@domain.tld',
    // birthday: is optional so undefined is ok
    // Throw TypeError because title: is undefined
});

```

## Type Validation

### Basic Types
- `'string'` - String values
- `'boolean'` - Truthy/Falsey values (coerced using `Boolean()`)
- `'object'` - Object literals
- `'array'` - Arrays of any length including 0
- `'function'` - Executable functions
- `'null'` - Empty values

### Number Types
- `'int'` - Integers with truncating coercion (uses `parseInt()`)
- `'roundint'` - Integers with rounding coercion (uses `Math.round()`)
- `'strictint'` - Integers without coercion
- `'number'` - Alias of `'float'`
- `'float'` - Floating point numbers with coercion (uses `parseFloat()`)
- `'strictfloat'` - Floating point numbers without coercion

### Special Types
- `'any'` - Any value including `null`, except `undefined`
- `'undefined'` - Alias of `'optional'`
- `'optional'` - Value can be `undefined`
- `'strictboolean'` - Booleans only without coercion
- `/^test$/ig` - Regular Expression literal (without quotes, uses `toString()`)
- `ClassName` - Class comparison (using `instanceof`)

### Custom Types
```javascript
class CustomType {
    constructor(value) {
        this.value = value;
    }
}

const method = new ValidatedMethod({
    instance: CustomType,          // Must be instance of CustomType
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
ValidatedMethod.quiet = true; // Suppress unexpected parameter warnings
const method = new ValidatedMethod({...bigObj}, callback);
```

## Parameter Styles

### Named Parameters
```javascript
const method = new ValidatedMethod({
    name: 'string',
    age: 'number'
}, opts => `${opts.name} is ${opts.age}`);

method({ name: 'Test', age: 42 });
```

### Single Parameter
```javascript
const $ = new ValidatedMethod('string', query => 
    document.querySelector(query)
);

$('.my-element'); // Returns element or null
```

### Positional Parameters
```javascript
const add = new ValidatedMethod(
    ['number', 'number'], (a, b) => a + b
);

add(40, 2); // Returns 42

const delayed = new ValidatedMethod(
    ['int', 'function'], (ms, callback) => setTimeout(callback, ms)
);

delayed(1000, () => console.log('Done!')); 
```

## Error Handling
Throws a `TypeError` for validation failures:

- Missing required parameters
- Type mismatches
- Coercion failures
- Invalid custom type instances

## Return Type Validation

You can optionally specify a return type as the third parameter:

```javascript
// Ensure function returns a string
const upperCase = new ValidatedMethod(
    'string', str => str.toUpperCase(), 'string'
);

// Validate class instances
// including custom and built in types
const getUser = new ValidatedMethod(
    'number',  id => db.findUser(id), User
);

const getNodes = new ValidatedMethod(
    [ Node, 'string' ],  (el, q) => el.querySelectorAll(q), NodeList
);

// Allow multiple return types
const getValue = new ValidatedMethod(
    'string', key => cache.get(key), ['string', 'null']
);

// Explicit void return, must return undefined
const logMessage = new ValidatedMethod(
    'string', msg => { console.log(msg); }, 'void'
);

// Any non-undefined return, null allowed
const process = new ValidatedMethod(
    'object', data => processData(data), 'any'
);
```

Return type validation supports:
- All basic types (`string`, `number`, `boolean`, etc)
- Custom classes (validates instanceof)
- Regular expressions (tests string conversion)
- Array of types for multiple options
- Special types:
  - `'void'` - Must return undefined
  - `'any'` - Any value except undefined
  - `'optional'` - Allows undefined returns

If no return type is specified, the function can return any value including undefined.
