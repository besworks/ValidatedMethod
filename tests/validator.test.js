import { ValidatedMethod } from "../validated-method.js";

// Test: Custom Validator Functions
try {
    const isEven = n => n % 2 === 0;
    const isEmail = str => /^[^@]+@[^@]+\.[^@]+$/.test(str);
    
    const validate = new ValidatedMethod({
        even: isEven,
        email: isEmail
    }, opts => opts);

    // Test validation failure
    try {
        validate({
            even: 43,
            email: 'test@example.com'
        });
        throw new Error('Should have failed even number validation');
    } catch (e) {
        if (!e.message.includes('failed validation for')) {
            throw new Error(`Wrong error for custom validation: ${e.message}`);
        }
    }

    console.log('✓ Custom validator function test passed');
} catch (e) {
    console.error('✗ Custom validator function test failed:', e.message);
}

try {
    // Test 1: Validator throwing an error
    const throwingValidator = new ValidatedMethod(
        val => { throw new Error('Validator error'); },
        val => val
    );

    try {
        throwingValidator('test');
        throw new Error('Should have failed on throwing validator');
    } catch (e) {
        console.assert(e.message.includes('Validator error'), 
            'Should propagate validator errors');
    }

    // Test 2: Truthy/Falsy validation
    const truthyValidator = new ValidatedMethod(
        val => 42,  // Returns truthy number
        val => val
    );
    const falsyValidator = new ValidatedMethod(
        val => '',  // Returns falsy string
        val => val
    );

    // Should pass with truthy value
    console.assert(
        truthyValidator('test') === 'test',
        'Should accept truthy validator returns'
    );

    // Should fail with falsy value
    try {
        falsyValidator('test');
        throw new Error('Should have failed on falsy return');
    } catch (e) {
        console.assert(e.message.includes('failed validation'),
            'Should reject falsy validator returns');
    }

    // Test 3: Async validator rejection
    try {
        new ValidatedMethod(
            async val => true,
            val => val
        )('test');
        throw new Error('Should reject async validator');
    } catch (e) {
        console.assert(e.message.includes('must be synchronous'),
            'Should explicitly reject async validators');
    }

    console.log('✓ Validator edge cases test passed');
} catch (e) {
    console.error('✗ Validator edge cases test failed:', e.message);
}
