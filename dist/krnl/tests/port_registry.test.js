/**
 * @file port_registry.test.ts
 * @description Regression test: commPort, portRegistry, and ports snapshot file
 *              must all reflect the OS-bound port, not the constructor hint.
 *
 * Invariant under test:
 *   snapshot(ports.json) = f(server.address().port)
 *   NOT f(constructor_arg)
 *
 * Test scenario:
 *   1. Occupy preferred port with a blocker server.
 *   2. Start krnlSystemEntityBase on that same preferred port.
 *   3. System must probe and fall back to preferred+N.
 *   4. Assert: commPort === portRegistry['_krnl_system'] === ports.json value
 *              AND commComponent.listenPort, unifiedHttpAdapter.port agree.
 *              AND none of the above equal the blocked preferred port.
 */
import net from 'net';
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { krnlSystemEntityBase } from '../core/K_ENT_Krnl_System_Entity_Base.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ── helpers ────────────────────────────────────────────────────────────────
function occupyPort(port, host = '0.0.0.0') {
    return new Promise((resolve, reject) => {
        const s = net.createServer();
        s.listen(port, host, () => resolve(s));
        s.on('error', reject);
    });
}
function closeServer(s) {
    return new Promise(resolve => s.close(() => resolve()));
}
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
// ── test ───────────────────────────────────────────────────────────────────
async function runTest() {
    const PREFERRED = 19099;
    let blocker = null;
    let system = null;
    const portsFile = path.join(__dirname, 'TestEntity.ports.json');
    try {
        // 1. Block the preferred port ─────────────────────────────────────
        blocker = await occupyPort(PREFERRED);
        console.log(`[test] Blocker holding port ${PREFERRED}`);
        // 2. Start system — must fall back ───────────────────────────────
        system = new krnlSystemEntityBase('TestEntity', null, PREFERRED, '0.0.0.0', {
            sourcePath: import.meta.url,
        });
        await system._startSharedServer();
        const actual = system.commPort;
        // 3. commPort must not equal blocked port ─────────────────────────
        assert.notStrictEqual(actual, PREFERRED, `FAIL commPort=${actual} still equals blocked port ${PREFERRED}`);
        console.log(`[test] ✓ commPort fell back to ${actual}`);
        // 4. portRegistry must match commPort ─────────────────────────────
        const regPort = system.portRegistry.get('_krnl_system');
        assert.strictEqual(regPort, actual, `FAIL portRegistry._krnl_system=${regPort} !== commPort=${actual}`);
        console.log(`[test] ✓ portRegistry._krnl_system === commPort`);
        // 5. Sub-components must match ────────────────────────────────────
        const ccPort = system.commComponent.listenPort;
        const adpPort = system.unifiedHttpAdapter.port;
        assert.strictEqual(ccPort, actual, `FAIL commComponent.listenPort=${ccPort} !== commPort=${actual}`);
        assert.strictEqual(adpPort, actual, `FAIL unifiedHttpAdapter.port=${adpPort} !== commPort=${actual}`);
        console.log(`[test] ✓ commComponent.listenPort and unifiedHttpAdapter.port agree`);
        // 6. ports.json must reflect actual port (allow async write) ──────
        await sleep(200);
        const raw = fs.readFileSync(portsFile, 'utf8');
        const snapshot = JSON.parse(raw);
        const filePort = snapshot.ports['_krnl_system'];
        assert.strictEqual(filePort, actual, `FAIL ports.json._krnl_system=${filePort} !== commPort=${actual}`);
        assert.notStrictEqual(filePort, PREFERRED, `FAIL ports.json still records the blocked preferred port ${PREFERRED}`);
        console.log(`[test] ✓ ports.json reflects actual bound port (not stale hint)`);
        console.log('\n✓  All port registry regression assertions passed.\n');
    }
    finally {
        if (system)
            system.dispose();
        if (blocker)
            await closeServer(blocker);
        for (const f of [portsFile]) {
            try {
                fs.unlinkSync(f);
            }
            catch (_) { }
        }
    }
}
runTest().catch(err => {
    console.error('\n✗  Port registry regression test FAILED:', err.message);
    process.exit(1);
});
//# sourceMappingURL=port_registry.test.js.map