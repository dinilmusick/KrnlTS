/**
 * Test: _handleRpcRequest error serialization fix with Gross Architecture Entity
 * Verifies that plain objects thrown as errors don't produce "[object Object]"
 */
import { Entity, krnlSystemCommComponent } from '../../../dist/index.js';

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
const sys1 = new Entity('TestSys1');
const comm1 = new krnlSystemCommComponent(sys1, 19901);
sys1.attachAdapter(comm1);
await sys1.finalize();

comm1.defineRpc('test-call', async () => {
    return {
        status: 'error',
        message: 'Syntax error identified.',
        eslintErrors: 'TestFile.js:5:3 - Unexpected token [no-undef]',
        details: 'TestFile.js:5:3 - Unexpected token [no-undef]'
    };
});

const result1 = await comm1.callWsRpc(`localhost:19901`, 'test-call', {});
assert(result1.status === 'error', 'result.status is "error"');
assert(result1.eslintErrors === 'TestFile.js:5:3 - Unexpected token [no-undef]', 'eslintErrors is plain string, not "[object Object]"');
assert(!result1.eslintErrors?.includes('[object Object]'), 'no "[object Object]" in eslintErrors');

// ── Test 2: RPC handler throws a plain object (the old bug) ───────────────────
console.log('\nTest 2: RPC handler throws a plain object');
const sys2 = new Entity('TestSys2');
const comm2 = new krnlSystemCommComponent(sys2, 19902);
sys2.attachAdapter(comm2);
await sys2.finalize();

comm2.defineRpc('throwing-call', async () => {
    // eslint-disable-next-line no-throw-literal
    throw { status: 'error', message: 'inner error detail', eslintErrors: 'line 1: bad syntax' };
});

try {
    await comm2.callWsRpc(`localhost:19902`, 'throwing-call', {});
    assert(false, 'Should have thrown');
} catch (e) {
    assert(!e.message.includes('[object Object]'), 'thrown plain-object error message does not say "[object Object]"');
    assert(e.message.includes('inner error detail') || e.message.includes('eslintErrors'), 'thrown error message contains actual details');
    console.log(`     Error message received: ${e.message.slice(0, 120)}`);
}

// ── Test 3: RPC handler throws a proper Error ─────────────────────────────────
console.log('\nTest 3: RPC handler throws a proper Error object');
const sys3 = new Entity('TestSys3');
const comm3 = new krnlSystemCommComponent(sys3, 19903);
sys3.attachAdapter(comm3);
await sys3.finalize();

comm3.defineRpc('error-call', async () => {
    throw new Error('Something went wrong in the handler');
});

try {
    await comm3.callWsRpc(`localhost:19903`, 'error-call', {});
    assert(false, 'Should have thrown');
} catch (e) {
    assert(e.message === 'Something went wrong in the handler', 'proper Error message preserved');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

sys1.dispose();
sys2.dispose();
sys3.dispose();

if (failed > 0) process.exit(1);
