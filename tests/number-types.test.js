import { ValidatedMethod } from "../validated-method.js";

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

