import { ValidatedMethod } from "../validated-method.js";

// Test: Function Parameter Validation
try {
    const functionMethod = new ValidatedMethod({
        callback: 'function',
        optionalFn: ['function', 'optional']
    }, opts => opts.callback());

    // Test valid function
    const result = functionMethod({
        callback: () => 'success'
    });
    console.assert(result === 'success', 'Function execution failed');

    // Test invalid function parameter
    try {
        functionMethod({
            callback: 'not a function'
        });
        throw new Error('Should have failed validation');
    } catch (e) {
        if (!e.message.includes('Expected function')) {
            throw new Error('Wrong error type for function validation');
        }
    }

    // Test optional function parameter
    const optionalResult = functionMethod({
        callback: () => 'success',
        optionalFn: undefined
    });
    console.assert(optionalResult === 'success', 'Optional function parameter failed');

    console.log('✓ Function parameter test passed');
} catch (e) {
    console.error('✗ Function parameter test failed:', e.message);
}

// Test: All optional parameters
try {
    const optionalParams = new ValidatedMethod({
        a: 'optional',
        b: ['string', 'optional'],
        c: ['number', 'optional']
    }, opts => opts || {});

    console.assert(
        JSON.stringify(optionalParams()) === '{}',
        'Should allow undefined when all params optional'
    );

    console.assert(
        JSON.stringify(optionalParams(null)) === '{}',
        'Should allow null when all params optional'
    );

    console.assert(
        JSON.stringify(optionalParams({})) === '{}',
        'Should allow empty object when all params optional'
    );

    console.log('✓ All optional parameters test passed');
} catch (e) {
    console.error('✗ All optional parameters test failed:', e.message);
}

// Test: Optional parameters callback receives empty object
try {
    let receivedValue;
    const method = new ValidatedMethod({
        a: 'optional',
        b: 'optional'
    }, opts => {
        receivedValue = opts;
        return true;
    });

    method();  // Call with no parameters
    console.assert(
        typeof receivedValue === 'object' && 
        Object.keys(receivedValue).length === 0,
        'Callback should receive empty object for all-optional params'
    );

    console.log('✓ Optional parameters callback test passed');
} catch (e) {
    console.error('✗ Optional parameters callback test failed:', e.message);
}

