import { ValidatedMethod } from './validated-method.js';

// Test class for custom type validation
class TestType {
    constructor(value) {
        this.value = value;
    }
}

console.log('Running ValidatedMethod tests...\n');

// Test 1: Basic Types
try {
    const basicTypes = new ValidatedMethod({
        str: 'string',
        num: 'number',
        bool: 'boolean',
        arr: 'array',
        obj: 'object'
    }, opts => opts);
    
    const result = basicTypes({
      str: 'test',
      num: '42',        // Should coerce
      bool: 1,          // Should coerce
      arr: [1, 2, 3],
      obj: { test: true }
    });

    console.assert(
        typeof result.str === 'string' &&
        typeof result.num === 'number' &&
        typeof result.bool === 'boolean' &&
        Array.isArray(result.arr) &&
        typeof result.obj === 'object',
        'Basic types validation failed'
    );
    
    console.log('✓ Basic types test passed');
} catch (e) {
    console.error('✗ Basic types test failed:', e.message);
}

// Test 2: Strict Types
try {
    const strictTypes = new ValidatedMethod({
        num: 'strictfloat',    // Changed from 'strictnumber'
        bool: 'strictboolean'
    }, opts => opts);

    try {
        strictTypes({ num: '42', bool: 1 });
        throw new Error('Should have failed strict validation');
    } catch (e) {
        if (!e.message.includes('Expected number')) {
            throw new Error('Wrong error message for strict float');
        }
    }
    console.log('✓ Strict types test passed');
} catch (e) {
    console.error('✗ Strict types test failed:', e.message);
}

// Test 3: Optional and Any
try {
    const optionalAny = new ValidatedMethod({
        required: 'string',
        optional: 'optional',
        anything: 'any'
    }, opts => opts);

    const result = optionalAny({
        required: 'test',
        anything: 42
    });

    console.assert(
        result.required === 'test' &&
        result.optional === undefined &&
        result.anything === 42,
        'Optional/Any validation failed'
    );
    console.log('✓ Optional and Any types test passed');
} catch (e) {
    console.error('✗ Optional and Any types test failed:', e.message);
}

// Test 4: Custom Types
try {
    const customType = new ValidatedMethod({
        instance: TestType,
        mixed: [TestType, 'object']
    }, opts => opts);

    const result = customType({
        instance: new TestType('test'),
        mixed: { prop: 'value' }
    });

    console.assert(
        result.instance instanceof TestType &&
        typeof result.mixed === 'object',
        'Custom type validation failed'
    );
    console.log('✓ Custom types test passed');
} catch (e) {
    console.error('✗ Custom types test failed:', e.message);
}

// Test 5: Type Coercion
try {
    const coercion = new ValidatedMethod({
        num: 'number',
        bool: 'boolean'
    }, opts => opts);

    const result = coercion({
        num: '42.5',
        bool: 'true'
    });

    console.assert(
        result.num === 42.5 &&
        result.bool === true,
        'Type coercion failed'
    );
    console.log('✓ Type coercion test passed');
} catch (e) {
    console.error('✗ Type coercion test failed:', e.message);
}

// Test 6: Error Cases
try {
    const errorCases = new ValidatedMethod({
        required: 'string'
    }, opts => opts);

    let errorCount = 0;

    // Missing required parameter
    try {
        errorCases({});
    } catch (e) {
        if (e.message.includes('Missing required parameter')) errorCount++;
    }

    // Wrong type
    try {
        errorCases({ required: 42 });
    } catch (e) {
        if (e.message.includes('Expected string')) errorCount++;
    }

    console.assert(errorCount === 2, 'Error cases validation failed');
    console.log('✓ Error cases test passed');
} catch (e) {
    console.error('✗ Error cases test failed:', e.message);
}

// Test: Number Types
try {
    const numberTypes = new ValidatedMethod({
        float: 'float',
        number: 'number',      // Alias for float
        strictFloat: 'strictfloat',
        int: 'int',           // Truncates decimals
        roundInt: 'roundint', // Rounds decimals
        strictInt: 'strictint'
    }, opts => opts);

    const result = numberTypes({
        float: '3.14',        // Should coerce to 3.14
        number: '2.718',      // Should coerce to 2.718
        strictFloat: 1.414,   // Should pass
        int: '42.9',         // Should coerce to 42
        roundInt: '42.9',    // Should coerce to 43
        strictInt: 42        // Should pass as-is
    });

    console.assert(
        result.float === 3.14 &&
        result.number === 2.718 &&
        result.strictFloat === 1.414 &&
        result.int === 42 &&
        result.roundInt === 43 &&
        result.strictInt === 42,
        'Number types validation failed'
    );

    // These should fail
    try {
        numberTypes({ strictFloat: '3.14' });  // Should fail - not a number
        numberTypes({ strictInt: 3.14 });      // Should fail - not an integer
        throw new Error('Should have failed validation');
    } catch (e) {
        if (e.message === 'Should have failed validation') {
            throw new Error('Validation did not catch invalid values');
        }
    }

    console.log('✓ Number types test passed');
} catch (e) {
    console.error('✗ Number types test failed:', e.message);
}

// Test: Integer Rounding Behaviors
try {
    const roundingTypes = new ValidatedMethod({
        truncated: 'int',
        rounded: 'roundint',
        strict: 'strictint'
    }, opts => opts);

    const result = roundingTypes({
        truncated: '42.9',   // Should become 42
        rounded: '42.9',     // Should become 43
        strict: 42           // Should pass as-is
    });

    console.assert(
        result.truncated === 42 &&
        result.rounded === 43 &&
        result.strict === 42,
        'Integer rounding validation failed'
    );
    console.log('✓ Integer rounding test passed');
} catch (e) {
    console.error('✗ Integer rounding test failed:', e.message);
}

// Test 7a: Unexpected Parameters
try {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);

    const unexpectedParams = new ValidatedMethod({
        expected: 'string'
    }, opts => opts);

    const result = unexpectedParams({
        expected: 'value',
        unexpected1: true,
        unexpected2: 42
    });

    console.warn = originalWarn;

    console.assert(
        warnings.length === 2 &&
        warnings[0].includes('Unexpected parameter: unexpected1') &&
        warnings[1].includes('Unexpected parameter: unexpected2') &&
        result.expected === 'value',
        'Unexpected parameter warnings failed'
    );
    console.log('✓ Unexpected parameters test passed');
} catch (e) {
    console.error('✗ Unexpected parameters test failed:', e.message);
}

// Test 7b: Quiet Mode
try {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);

    const quietParams = new ValidatedMethod({
        expected: 'string'
    }, opts => opts);

    ValidatedMethod.quiet = true;
    const result = quietParams({
        expected: 'value',
        unexpected1: true,
        unexpected2: 42
    });
    ValidatedMethod.quiet = false;

    console.warn = originalWarn;

    console.assert(
        warnings.length === 0 &&
        result.expected === 'value',
        'Quiet mode suppression failed'
    );
    console.log('✓ Quiet mode test passed');
} catch (e) {
    console.error('✗ Quiet mode test failed:', e.message);
}

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