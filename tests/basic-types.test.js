import { ValidatedMethod } from "../validated-method.js";

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

