/**
 * Test: _handleRpcRequest error serialization fix
 * Verifies that plain objects thrown as errors don't produce "[object Object]"
 */
import { krnlSystemEntityBase } from './dist/index.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        console.log(`  ✅ PASS: ${label}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${label}`);
        failed++;
    }
}

// ── Test 1: RPC call returns a structured result (eslintErrors path) ──────────
console.log('\nTest 1: RPC returns structured result with eslintErrors field');
const sys1 = new krnlSystemEntityBase('TestSys1', null, 19901);
await sys1.commComponent.startWsServer();

sys1.commComponent.defineRpc('test-call', async () => {
    // Simulate what CheckCode/logic returns on eslint failure
    return {
        status: 'error',
        message: 'Syntax error identified.',
        eslintErrors: 'TestFile.js:5:3 - Unexpected token [no-undef]',
        details: 'TestFile.js:5:3 - Unexpected token [no-undef]'
    };
});

const result1 = await sys1.commComponent.callWsRpc(`localhost:19901`, 'test-call', {});
assert(result1.status === 'error', 'result.status is "error"');
assert(result1.eslintErrors === 'TestFile.js:5:3 - Unexpected token [no-undef]', 'eslintErrors is plain string, not "[object Object]"');
assert(!result1.eslintErrors?.includes('[object Object]'), 'no "[object Object]" in eslintErrors');

// ── Test 2: RPC handler throws a plain object (the old bug) ───────────────────
console.log('\nTest 2: RPC handler throws a plain object');
const sys2 = new krnlSystemEntityBase('TestSys2', null, 19902);
await sys2.commComponent.startWsServer();

sys2.commComponent.defineRpc('throwing-call', async () => {
    // eslint-disable-next-line no-throw-literal
    throw { status: 'error', message: 'inner error detail', eslintErrors: 'line 1: bad syntax' };
});

try {
    await sys2.commComponent.callWsRpc(`localhost:19902`, 'throwing-call', {});
    assert(false, 'Should have thrown');
} catch (e) {
    assert(!e.message.includes('[object Object]'), 'thrown plain-object error message does not say "[object Object]"');
    assert(e.message.includes('inner error detail') || e.message.includes('eslintErrors'), 'thrown error message contains actual details');
    console.log(`     Error message received: ${e.message.slice(0, 120)}`);
}

// ── Test 3: RPC handler throws a proper Error ─────────────────────────────────
console.log('\nTest 3: RPC handler throws a proper Error object');
const sys3 = new krnlSystemEntityBase('TestSys3', null, 19903);
await sys3.commComponent.startWsServer();

sys3.commComponent.defineRpc('error-call', async () => {
    throw new Error('Something went wrong in the handler');
});

try {
    await sys3.commComponent.callWsRpc(`localhost:19903`, 'error-call', {});
    assert(false, 'Should have thrown');
} catch (e) {
    assert(e.message === 'Something went wrong in the handler', 'proper Error message preserved');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

sys1.commComponent.dispose();
sys2.commComponent.dispose();
sys3.commComponent.dispose();

if (failed > 0) process.exit(1);
