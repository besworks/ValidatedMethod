import { ValidatedMethod, _$ } from "../validated-method.js";

// Test: Helper Function (_$)
try {
    // Test named parameters
    const namedMethod = _$({
        name: 'string'
    }, opts => opts.name);

    // Test single parameter
    const singleMethod = _$('number', n => n * 2);

    // Test array parameters
    const arrayMethod = _$(['string', 'number'], (str, num) => ({ str, num }));

    // Test with return type
    const returnMethod = _$('string', str => str.toUpperCase(), 'string');

    // Verify all helper variants work
    console.assert(
        namedMethod({ name: 'test' }) === 'test' &&
        singleMethod(21) === 42 &&
        arrayMethod('test', 42).num === 42 &&
        returnMethod('test') === 'TEST',
        'Helper function validation failed'
    );

    // Verify it's a ValidatedMethod instance
    console.assert(
        namedMethod.originalMethod instanceof ValidatedMethod,
        'Helper should create ValidatedMethod instances'
    );

    console.log('✓ Helper function (_$) test passed');
} catch (e) {
    console.error('✗ Helper function (_$) test failed:', e.message);
}

