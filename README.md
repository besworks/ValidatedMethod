# ValidatedMethod
Provides runtime type checking for JavaScript function parameters similar to TypeScript, but with no compiling or dependencies. 

## Features
- Zero dependencies
- TypeScript-like parameter validation in pure JavaScript
- Named, single, and positional parameter support
- Coercion options for numbers and booleans
- Regular Expression validation for strings
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
- `(a) => a === b` - any declared or incline function can be used as a validator

### Import Alias

The `_$` helper is provided for convenience but can be renamed on import if it conflicts with other libraries:

```javascript
import { _$ as VM } from './validated-method.js';
const getData = VM('string', performLookupByName);
```

### Custom Types
```javascript
class Widget {
    node = document.getElementById('widget')
        ?? document.createElement('custom-widget');
}

const configureWidget = _$({
    widget: Widget,
    className: 'string'
}, (opts) => {
    opts.widget.node.classList.add(opts.className);
    // safe to call classList because we know
    // opts.widget.node is an HTMLElement
    // and opts.className is a string
});

configureWidget(new WidgetHandler(), 'green');
```

## Extra Parameter Warnings

By default, ValidatedMethod warns about unexpected parameters:

```javascript
const addRecord = _$({
    name: 'string'
    age: 'number'
}, insertData);

addRecord({
    name: 'test',
    age: 40,
    extra: true  // Warning: "Unexpected parameter: extra"
});
```

### Quiet Mode

You can globally supress warnings with the static `quiet` flag.

```javascript
ValidatedMethod.quiet = true;

const getData = _$({
    bleep: 'boolean',
    bloop: 'array'
}, opts => {
    return {
        opts.bleep,
        opts.bloop
    }
});

const ref = {
    bleep: true,
    bloop: [],
    derp: { ...bigObj },
    zzz: 'more'
};

getData(ref); // no warnings, best for production
```

## Parameter Styles

### Named Parameters
```javascript
const method = _$(
    { name: 'string', age: 'number' },
    opts => `${opts.name} is ${opts.age}`
);

method({ name: 'Test', age: 42 });
```

### Single Parameter
```javascript
// Using type identifier
const $ = _$('string', query => 
    document.querySelector(query)
);

$('.my-element');

// Using Custom class
const process = _$(
    CustomType, instance => instance.process()
);
```

### Positional Parameters
```javascript
const add = _$(
    ['number', 'number'], (a, b) => a + b
);

add(40, 2); // Returns 42

const delayed = _$(
    ['int', 'function'], (ms, callback) => setTimeout(callback, ms)
);

delayed(1000, () => console.log('Done!')); 
```

## Zero Parameter Functions

For functions that take no parameters, you can use any of these equivalent forms:

```javascript
// These all create a parameterless function that returns a number
const fn1 = _$(undefined, () => 42, 'number');
const fn2 = _$(null, () => 42, 'number');
const fn3 = _$('void', () => 42, 'number');
const fn4 = _$([], () => 42, 'number');

// Usage
const result = fn1();  // Returns 42
fn1(42);  // Throws: Expected 0 arguments, got 1
```

### Custom Validators

You can use functions as input type validators. They **must** be synchronous and return a truthy/falsey value.

```javascript
const isEven = n => n % 2 === 0;
const getHalf = _$(isEven, num => num/2);
getHalf(42); // Accepted input
getHalf(43); // TypeError

// declared inline
const ref = 1;
const getExact = _$(
    a => a === ref,
    num => num
);
```

## Error Handling
Throws a `TypeError` for validation failures:

- Missing required parameters
- Type mismatches
- Coercion failures
- Invalid custom type instances

## Return Type Validation

You can optionally specify an expected return type as the third parameter.

### Supported Return Types

- All input type identifiers (`'string'`, `'number'`, `'boolean'`, `'null'`, etc)
- Custom classes (validates instanceof)
- Regular expressions (tests string conversion)
- Array of types for multiple options
- Special types:
  - `'void'` or `undefined` - Must return undefined
  - `'any'` - Any value except undefined
  - `'optional'` - Included for completeness, this is the same as not specifying a return type. Return type is not checked.
  - `a => a === b` - Use any declared or inline function to validate output
  
### Return Type Examples

```javascript
// Ensure function returns a string
const upperCase = _$(
    'string', str => str.toUpperCase(), 'string'
);

// Validate class instances
// including custom and built in types
const getUser = _$(
    'number', id => db.findUser(id), User
);

const getNodes = _$(
    [ Node, 'string' ], (el, q) => el.querySelectorAll(q), NodeList
);

// Allow multiple return types
const getValue = _$(
    'string', key => cache.get(key), ['string', 'null']
);

// Explicit void return, must return undefined
const logMessage = _$(
    'string', msg => { console.log(msg); }, 'void'
);

// Any non-undefined return, null allowed
const process = _$(
    'object', data => processData(data), 'any'
);

// Regular Expression test string output
const checkValue = _$(
    'string', str => procesValue(str), /^testing$/i
);

// custom validator function
const offset = 10;
const getPositive = _$(
    'number', num => num - offset, n => n > 0
);
getPositive(5); // returns -5, would fail validation

// check by reference
const complexTask = _$(
    null, doSomething, checkResults
);
```