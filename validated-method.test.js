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

// Test 7: Unexpected Parameters
try {
    // Capture console.warn output
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

    // Restore console.warn
    console.warn = originalWarn;

    console.assert(
        warnings.length === 2 &&
        warnings[0].includes('Unexpected parameter: unexpected1') &&
        warnings[1].includes('Unexpected parameter: unexpected2'),
        'Unexpected parameter warnings failed'
    );
    console.log('✓ Unexpected parameters test passed');
} catch (e) {
    console.error('✗ Unexpected parameters test failed:', e.message);
}