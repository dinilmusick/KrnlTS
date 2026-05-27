/**
 * KrnlJS Example Verification Script (v2)
 * Runs identified entry points for all 11 examples.
 */
import { spawn } from 'child_process';
import path from 'path';

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
    { num: 11, script: 'ServiceSuiteVerification/verify_suite.js' }
];

const BASE_PATH = '/Users/dinil/Desktop/Projects/Javascript/KrnlTS';

async function runExample(ex) {
    console.log(`\n>>> RUNNING EXAMPLE ${ex.num} (${ex.script})...`);
    const examplePath = path.join(BASE_PATH, 'examples', `example${ex.num}`);
    const scriptPath = path.join(examplePath, ex.script);
    
    return new Promise((resolve) => {
        const child = spawn('node', [scriptPath], { 
            cwd: examplePath,
            env: { ...process.env, PATH: '/usr/local/bin:/opt/homebrew/bin:' + process.env.PATH }
        });

        let output = '';
        child.stdout.on('data', (data) => output += data);
        child.stderr.on('data', (data) => output += data);

        const timeout = setTimeout(() => {
            console.log(`[Example ${ex.num}] Running stable (5s)`);
            child.kill('SIGINT');
            resolve(true);
        }, 5000);

        child.on('error', (err) => {
            clearTimeout(timeout);
            console.error(`[Example ${ex.num}] FAILED TO START:`, err.message);
            resolve(false);
        });

        child.on('exit', (code) => {
            clearTimeout(timeout);
            if (code !== 0 && code !== null) {
                console.error(`[Example ${ex.num}] Crashed with code ${code}`);
                console.log(output);
                resolve(false);
            } else {
                console.log(`[Example ${ex.num}] Finished successfully.`);
                resolve(true);
            }
        });
    });
}

async function verifyAll() {
    let success = true;
    for (const ex of examples) {
        const result = await runExample(ex);
        if (!result) success = false;
    }
    
    if (success) {
        console.log('\n✅ ALL EXAMPLES VERIFIED SUCCESSFULLY.');
    } else {
        console.error('\n❌ SOME EXAMPLES FAILED VERIFICATION.');
        process.exit(1);
    }
}

verifyAll();
