import { ValidatedMethod } from "../validated-method.js";

// Test: Return Type Validation
try {
    const stringReturn = new ValidatedMethod(
        ['number', 'number'],
        (a, b) => a + b,
        'string'  // Expect string return
    );

    try {
        stringReturn(40, 2);  // Returns number, should fail
        throw new Error('Should have failed return type validation');
    } catch (e) {
        if (!e.message.includes('does not match type string')) {
            throw new Error('Wrong error type for return validation');
        }
    }

    const numberOrString = new ValidatedMethod(
        'string',
        str => str.length,
        ['number', 'string']  // Allow either type
    );

    console.assert(
        typeof numberOrString('test') === 'number',
        'Return type validation failed for multiple types'
    );

    // Test async return type
    const asyncMethod = new ValidatedMethod(
        'string',
        async str => str.toUpperCase(),
        'string'
    );

    asyncMethod('test').then(result => {
        console.assert(
            result === 'TEST',
            'Async return type validation failed'
        );
    });

    console.log('✓ Return type validation test passed');
} catch (e) {
    console.error('✗ Return type validation test failed:', e.message);
}

// Test: Return Type Edge Cases
// Test: Return Type Edge Cases
try {
    // Test void requires undefined
    const voidMethod = new ValidatedMethod(
        'string',
        str => undefined,
        'void'
    );
    console.assert(
        voidMethod('test') === undefined,
        'Void return validation failed'
    );

    // Test void rejects values
    const badVoidMethod = new ValidatedMethod(
        'string',
        str => 'not void',
        'void'
    );
    try {
        badVoidMethod('test');
        throw new Error('Should reject non-void return');
    } catch (e) {
        if (!e.message.includes('does not match type void')) {
            throw new Error('Wrong error for void validation');
        }
    }

    // Test any allows everything except undefined
    const anyMethod = new ValidatedMethod(
        'string',
        str => str === 'undefined' ? undefined : str,
        'any'
    );
    try {
        anyMethod('undefined');
        throw new Error('Should reject undefined for any');
    } catch (e) {
        if (!e.message.includes('does not match type any')) {
            throw new Error('Wrong error for any validation');
        }
    }
    console.assert(
        anyMethod('test') === 'test',
        'Any return validation failed'
    );

    // Test undefined returnType allows everything
    const unvalidatedMethod = new ValidatedMethod(
        'string',
        str => str === 'undefined' ? undefined : str
    );
    console.assert(
        unvalidatedMethod('test') === 'test' &&
        unvalidatedMethod('undefined') === undefined,
        'Unvalidated return failed'
    );

    console.log('✓ Return type edge cases test passed');
} catch (e) {
    console.error('✗ Return type edge cases test failed:', e.message);
}

// Add after Return Type Edge Cases test

// Test: Async Return Type Validation
// Test: Async Return Type Validation
async function runAsyncReturnTests() {
    try {
        // Test async string return
        const asyncString = new ValidatedMethod(
            'string',
            async str => str.toUpperCase(),
            'string'
        );
        
        const strResult = await asyncString('test');
        console.assert(
            strResult === 'TEST',
            'Async string return validation failed'
        );

        // Test async with multiple allowed return types
        const asyncMulti = new ValidatedMethod(
            'number',
            async n => n > 10 ? String(n) : n,
            ['string', 'number']
        );

        const multiResult1 = await asyncMulti(42);
        const multiResult2 = await asyncMulti(5);
        console.assert(
            typeof multiResult1 === 'string' &&
            typeof multiResult2 === 'number',
            'Async multiple return types validation failed'
        );

        // Test async void return
        const asyncVoid = new ValidatedMethod(
            'string',
            async str => { await Promise.resolve(); },
            'void'
        );
        
        const voidResult = await asyncVoid('test');
        console.assert(
            voidResult === undefined,
            'Async void return validation failed'
        );

        // Test async return type failure
        const asyncFail = new ValidatedMethod(
            'string',
            async () => 42,
            'string'
        );

        try {
            await asyncFail('test');
            throw new Error('Should have failed async return validation');
        } catch (e) {
            if (!e.message.includes('does not match type string')) {
                throw new Error('Wrong error type for async return validation');
            }
        }

        console.log('✓ Async return type validation test passed');
    } catch (e) {
        console.error('✗ Async return type validation test failed:', e.message);
    }
}

// Run async return tests
runAsyncReturnTests();

// Test: Zero Parameter Functions
try {
    // Test various zero-parameter declarations
    const voidFn1 = new ValidatedMethod(undefined, () => 42, 'number');
    const voidFn2 = new ValidatedMethod(null, () => 'test', 'string');
    const voidFn3 = new ValidatedMethod('void', () => true, 'boolean');
    const voidFn4 = new ValidatedMethod([], () => new Date(), Date);

    console.assert(
        voidFn1() === 42 &&
        voidFn2() === 'test' &&
        voidFn3() === true &&
        voidFn4() instanceof Date,
        'Zero parameter function validation failed'
    );

    // Test parameter validation
    try {
        voidFn1(42);  // Should fail - no parameters allowed
        throw new Error('Should have failed extra parameter validation');
    } catch (e) {
        if (!e.message === 'Expected 0 arguments, got 1') {
            throw new Error(`Wrong error message: ${e.message}`);
        }
    }

    // Test return type validation
    const badReturn = new ValidatedMethod(undefined, () => undefined, 'string');
    try {
        badReturn();
        throw new Error('Should have failed return type validation');
    } catch (e) {
        if (!e.message.includes('does not match type string')) {
            throw new Error('Wrong error type for return validation');
        }
    }

    console.log('✓ Zero parameter function test passed');
} catch (e) {
    console.error('✗ Zero parameter function test failed:', e.message);
}

// Test custom validator return type
try {
    const isPositive = n => typeof n === 'number' && n > 0;
    const positiveReturn = new ValidatedMethod(
        'string',
        str => str.length,
        isPositive
    );

    console.assert(
        positiveReturn('test') === 4,
        'Custom return validator failed for valid value'
    );

    try {
        positiveReturn('');  // Returns 0, should fail validation
        throw new Error('Should have failed custom return validation');
    } catch (e) {
        if (!e.message.includes('does not match type custom validator')) {
            throw new Error('Wrong error for custom return validation');
        }
    }

    console.log('✓ Custom return validator test passed');
} catch (e) {
    console.error('✗ Custom return validator test failed:', e.message);
}

