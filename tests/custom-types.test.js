import { ValidatedMethod } from "../validated-method.js";

// Test class for custom type validation
class TestType {
    constructor(value) {
        this.value = value;
    }
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

