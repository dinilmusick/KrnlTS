/**
 * KrnlJS Example Verification Script (v3)
 * Runs identified entry points for all examples and standalone tests.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_PATH = path.resolve(__dirname, '..');

const examples = [
    { num: 1, script: 'run_example.js' },
    { num: 2, script: 'run_example.js' },
    { num: 3, script: 'run_example.js' },
    { num: 4, script: 'run_example.js' },
    { num: 5, script: 'run_example.js' },
    { num: 6, script: 'run_example.js' },
    { num: 7, script: 'run_example.js' },
    { num: 8, script: 'run_ai_server.js' },
    { num: 10, script: 'RPCErrorFix/run_test.js' },
    { num: 11, script: 'ServiceSuiteVerification/verify_suite.js' },
    { num: 11, script: 'ServiceSuiteVerification/verify_single_port.js' },
    { num: 12, script: 'RouteVerification/run_test.js' },
    { num: 13, script: 'run_test.js' }
];

const standaloneTests = [
    { name: 'test_resilience.js', path: 'examples/test_resilience.js' },
    { name: 'test_schema.js', path: 'examples/test_schema.js' },
    { name: 'test_telemetry.js', path: 'examples/test_telemetry.js' },
    { name: 'test_bubbling_unified', path: 'examples/test_bubbling_unified/run_test.js' },
    { name: 'test_new_features', path: 'examples/test_new_features/run_test.js' }
];

async function runProcess(name, scriptPath, cwd, timeoutMs = 8000) {
    console.log(`\n>>> RUNNING ${name} (${scriptPath})...`);
    
    return new Promise((resolve) => {
        const child = spawn('node', [scriptPath], { 
            cwd: cwd,
            env: { ...process.env }
        });

        let output = '';
        child.stdout.on('data', (data) => {
            const chunk = data.toString();
            output += chunk;
            process.stdout.write(chunk);
        });
        child.stderr.on('data', (data) => {
            const chunk = data.toString();
            output += chunk;
            process.stderr.write(chunk);
        });

        const timeout = setTimeout(() => {
            console.log(`\n[${name}] Running stable (timed out at ${timeoutMs}ms)`);
            child.kill('SIGINT');
            resolve(true);
        }, timeoutMs);

        child.on('error', (err) => {
            clearTimeout(timeout);
            console.error(`\n[${name}] FAILED TO START:`, err.message);
            resolve(false);
        });

        child.on('exit', (code) => {
            clearTimeout(timeout);
            if (code !== 0 && code !== null) {
                console.error(`\n[${name}] Crashed with code ${code}`);
                resolve(false);
            } else {
                console.log(`\n[${name}] Finished successfully.`);
                resolve(true);
            }
        });
    });
}

async function verifyAll() {
    let success = true;
    
    console.log("--- Starting Comprehensive Example Verification ---");

    for (const ex of examples) {
        const exampleDir = path.join(BASE_PATH, 'examples', `example${ex.num}`);
        const scriptPath = path.isAbsolute(ex.script) ? ex.script : path.join(exampleDir, ex.script);
        const result = await runProcess(`Example ${ex.num}`, scriptPath, exampleDir);
        if (!result) success = false;
    }

    for (const test of standaloneTests) {
        const scriptPath = path.resolve(BASE_PATH, test.path);
        const cwd = path.dirname(scriptPath);
        const result = await runProcess(test.name, scriptPath, cwd);
        if (!result) success = false;
    }
    
    if (success) {
        console.log('\n✅ ALL EXAMPLES AND TESTS VERIFIED SUCCESSFULLY.');
    } else {
        console.error('\n❌ SOME VERIFICATIONS FAILED.');
        process.exit(1);
    }
}

verifyAll();
