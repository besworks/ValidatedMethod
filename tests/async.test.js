import { ValidatedMethod } from "../validated-method.js";

// Test 8: Async Methods
async function runAsyncTests() {
    try {
        const asyncMethod = new ValidatedMethod({
            input: 'string',
            timeout: 'number'
        }, async (opts) => {
            await new Promise(resolve => setTimeout(resolve, opts.timeout));
            return `Processed: ${opts.input}`;
        });

        // Test successful async execution
        const successResult = await asyncMethod({
            input: 'test',
            timeout: 100
        });
        
        console.assert(
            successResult === 'Processed: test',
            'Async method result failed'
        );
        console.log('✓ Async method test passed');

        // Test parameter validation in async context
        try {
            await asyncMethod({
                input: 42,  // Should fail type validation
                timeout: 100
            });
            throw new Error('Should have failed validation');
        } catch (e) {
            if (e.message.includes('Expected string')) {
                console.log('✓ Async stress test passed');
            } else {
                console.error('✗ Async stress test failed', e.message);
            }
        }

        // Test 9: Promise Chain
        const promiseChain = new ValidatedMethod({
            data: 'array'
        }, opts => Promise.resolve(opts.data)
            .then(data => data.map(x => x * 2))
        );

        const chainResult = await promiseChain({
            data: [1, 2, 3]
        });
        
        console.assert(
            JSON.stringify(chainResult) === '[2,4,6]',
            'Promise chain result failed'
        );
        console.log('✓ Promise chain test passed');

        // Test concurrent async execution
        const results = await Promise.all([
            asyncMethod({ input: 'first', timeout: 50 }),
            asyncMethod({ input: 'second', timeout: 30 })
        ]);
        
        console.assert(
            results[0] === 'Processed: first' &&
            results[1] === 'Processed: second',
            'Concurrent async execution failed'
        );
        console.log('✓ Concurrent async test passed');

        // Test timeout rejection
        const timeoutMethod = new ValidatedMethod({
            input: 'string'
        }, async () => {
            throw new Error('Timeout occurred');
        });

        try {
            await timeoutMethod({ input: 'test' });
            throw new Error('Should have failed with timeout');
        } catch (e) {
            if (e.message === 'Timeout occurred') {
                console.log('✓ Async timeout test passed');
            } else {
                throw e;
            }
        }

        // Test promise rejection handling
        const rejectingMethod = new ValidatedMethod({
            shouldFail: 'boolean'
        }, opts => opts.shouldFail ? Promise.reject(new Error('Expected failure')) : Promise.resolve('OK'));

        try {
            await rejectingMethod({ shouldFail: true });
            throw new Error('Should have rejected');
        } catch (e) {
            if (e.message === 'Expected failure') {
                console.log('✓ Promise rejection test passed');
            } else {
                throw e;
            }
        }

    } catch (e) {
        console.error('✗ Async tests failed:', e.message);
    }
}

// Run async tests
runAsyncTests();

// Test: Multiple Types and Optional Aliases
try {
    const multiTypeMethod = new ValidatedMethod({
        optionalString1: ['string', 'optional'],
        optionalString2: ['string', 'undefined'],
        optionalNumber1: ['number', 'optional'],
        optionalNumber2: ['number', 'undefined'],
        requiredStringOrNumber: ['string', 'number']
    }, opts => opts);

    // Test with all parameters
    const result1 = multiTypeMethod({
        optionalString1: 'test1',
        optionalString2: 'test2',
        optionalNumber1: 42,
        optionalNumber2: 43,
        requiredStringOrNumber: 'test'
    });

    // Test with omitted optional parameters
    const result2 = multiTypeMethod({
        requiredStringOrNumber: 44
    });

    // Test with undefined optional parameters
    const result3 = multiTypeMethod({
        optionalString1: undefined,
        optionalString2: undefined,
        optionalNumber1: undefined,
        optionalNumber2: undefined,
        requiredStringOrNumber: 'test'
    });

    console.assert(
        result1.optionalString1 === 'test1' &&
        result1.optionalString2 === 'test2' &&
        result1.optionalNumber1 === 42 &&
        result1.optionalNumber2 === 43 &&
        result1.requiredStringOrNumber === 'test' &&
        result2.optionalString1 === undefined &&
        result2.optionalString2 === undefined &&
        result2.optionalNumber1 === undefined &&
        result2.optionalNumber2 === undefined &&
        result2.requiredStringOrNumber === 44 &&
        result3.optionalString1 === undefined &&
        result3.optionalString2 === undefined &&
        result3.optionalNumber1 === undefined &&
        result3.optionalNumber2 === undefined &&
        result3.requiredStringOrNumber === 'test',
        'Multiple types and optional aliases validation failed'
    );

    // Test required multi-type parameter
    multiTypeMethod({
        requiredStringOrNumber: 42  // number should work
    });
    multiTypeMethod({
        requiredStringOrNumber: 'test'  // string should work
    });

    console.log('✓ Multiple types and optional aliases test passed');
} catch (e) {
    console.error('✗ Multiple types and optional aliases test failed:', e.message);
}

// Test: Null Value Handling
try {
    const nullableMethod = new ValidatedMethod({
        nullableString: ['string', 'null'],
        nullableNumber: ['number', 'null'],
        nonNullable: 'string',
        optionalNullable: ['string', 'null', 'optional']
    }, opts => opts);

    // Test with null values
    const result1 = nullableMethod({
        nullableString: null,
        nullableNumber: null,
        nonNullable: 'required'
    });

    // Test with mixture of null and valid values
    const result2 = nullableMethod({
        nullableString: 'test',
        nullableNumber: 42,
        nonNullable: 'required',
        optionalNullable: null
    });

    // Verify null handling
    console.assert(
        result1.nullableString === null &&
        result1.nullableNumber === null &&
        result1.nonNullable === 'required' &&
        result1.optionalNullable === undefined &&
        result2.nullableString === 'test' &&
        result2.nullableNumber === 42 &&
        result2.optionalNullable === null,
        'Null value handling failed'
    );

    // Test null rejection on non-nullable field
    try {
        nullableMethod({
            nullableString: null,
            nullableNumber: null,
            nonNullable: null  // Should fail
        });
        throw new Error('Should have rejected null for non-nullable field');
    } catch (e) {
        if (!e.message.includes('Expected string')) {
            throw new Error('Wrong error type for null validation');
        }
    }

    console.log('✓ Null value handling test passed');
} catch (e) {
    console.error('✗ Null value handling test failed:', e.message);
}

// Test: Regex Validation
try {
    const regexMethod = new ValidatedMethod({
        email: /^[^@]+@[^@]+\.[^@]+$/,
        phone: /^\d{3}-\d{3}-\d{4}$/,
        code: /^[A-Z]{2}\d{4}$/,
        coercible: /^\d+$/
    }, opts => opts);

    // Test valid values
    const result = regexMethod({
        email: 'test@example.com',
        phone: '555-123-4567',
        code: 'AB1234',
        coercible: 42
    });

    console.assert(
        result.email === 'test@example.com' &&
        result.phone === '555-123-4567' &&
        result.code === 'AB1234' &&
        result.coercible === '42',
        'Regex validation failed'
    );

    // Test invalid values
    try {
        regexMethod({
            email: 'invalid-email',
            phone: '555-123-4567',
            code: 'AB1234',
            coercible: '42'
        });
        throw new Error('Should have failed email validation');
    } catch (e) {
        if (!e.message.includes('does not match pattern')) {
            throw new Error('Wrong error type for regex validation');
        }
    }

    // Test unconvertible value
    const symbol = Symbol('test');
    try {
        regexMethod({
            email: symbol,  // Symbols can't be converted to strings
            phone: '555-123-4567',
            code: 'AB1234',
            coercible: '42'
        });
        throw new Error('Should have failed conversion');
    } catch (e) {
        if (!e.message.includes('Cannot convert Symbol')) {
            throw new Error(`Wrong error type for conversion failure: ${e.message}`);
        }
    }

    console.log('✓ Regex validation test passed');
} catch (e) {
    console.error('✗ Regex validation test failed:', e.message);
}

// Test: Single Parameter Support
try {
    const stringOnly = new ValidatedMethod('string', value => value.toUpperCase());
    const numberOnly = new ValidatedMethod('number', value => value * 2);
    
    // Test direct parameter passing
    const str = stringOnly('test');
    const num = numberOnly(21);
    
    console.assert(
        str === 'TEST' &&
        num === 42,
        'Single parameter validation failed'
    );

    // Test type validation
    try {
        stringOnly(42);
        throw new Error('Should have failed type validation');
    } catch (e) {
        if (!e.message.includes('Expected string')) {
            throw new Error('Wrong error type for single parameter validation');
        }
    }

    console.log('✓ Single parameter test passed');
} catch (e) {
    console.error('✗ Single parameter test failed:', e.message);
}

// Test: Single Custom Type Parameter
try {
    class TestType {
        constructor(value) {
            this.value = value;
        }
    }

    const customSingle = new ValidatedMethod(
        TestType,
        instance => instance.value
    );

    const testInstance = new TestType(42);
    const result = customSingle(testInstance);
    
    console.assert(
        result === 42,
        'Single custom type parameter failed'
    );

    try {
        customSingle({});
        throw new Error('Should have failed type validation');
    } catch (e) {
        if (!e.message.includes('Expected TestType')) {
            throw new Error('Wrong error type for custom type validation');
        }
    }

    console.log('✓ Single custom type parameter test passed');
} catch (e) {
    console.error('✗ Single custom type parameter test failed:', e.message);
}

// Test: Array Arguments
try {
    const add = new ValidatedMethod(['number', 'number'], (a, b) => a + b);
    const concat = new ValidatedMethod(['string', 'string', 'string'], (a, b, c) => a + b + c);
    
    const sum = add(40, 2);
    const str = concat('Hello', ' ', 'World');
    
    console.assert(
        sum === 42 &&
        str === 'Hello World',
        'Array arguments validation failed'
    );

    // Test argument count
    try {
        add(1);
        throw new Error('Should have failed argument count validation');
    } catch (e) {
        if (!e.message.includes('Expected 2 arguments')) {
            throw new Error('Wrong error type for argument count validation');
        }
    }

    // Test type validation
    try {
        add('not', 'numbers');
        throw new Error('Should have failed type validation');
    } catch (e) {
        if (!e.message.includes('Expected number')) {
            throw new Error('Wrong error type for argument type validation');
        }
    }

    console.log('✓ Array arguments test passed');
} catch (e) {
    console.error('✗ Array arguments test failed:', e.message);
}

