import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tests = [
    'basic-types.test.js',
    'number-types.test.js',
    'custom-types.test.js',
    'parameters.test.js',
    'async.test.js',
    'return-types.test.js',
    'validator.test.js',
    'helper-and-modes.test.js'
];

console.log('Running ValidatedMethod Test Suite\n');

let passed = 0;
let failed = 0;

for (const test of tests) {
    try {
        const testPath = join(__dirname, test);
        const result = await new Promise((resolve, reject) => {
            const proc = spawn('node', [testPath], {
                stdio: ['inherit', 'pipe', 'pipe']
            });
            
            let output = '';
            proc.stdout.on('data', data => {
                output += data;
                process.stdout.write(data);
            });
            
            proc.stderr.on('data', data => {
                output += data;
                process.stderr.write(data);
            });
            
            proc.on('close', code => {
                resolve({ code, output });
            });
        });
        
        if (result.code === 0 && !result.output.includes('test failed:')) {
            passed++;
            if (!result.output.includes('Running ValidatedMethod tests...')) {
                console.log('✓ Test passed:', test);
            }
        } else {
            failed++;
        }
    } catch (e) {
        console.error(`Failed to run ${test}:`, e);
        failed++;
    }
}

console.log('\nTest Summary:');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${tests.length}`);

process.exit(failed > 0 ? 1 : 0);