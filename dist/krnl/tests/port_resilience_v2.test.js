/**
 * @file port_resilience_v2.test.ts
 * @description Enhanced regression test for KrnlTS port management and readiness.
 *
 * Verifies:
 * 1. Port fallback (Single Source of Truth).
 * 2. Explicit readiness signaling via whenReady().
 * 3. Snapshot existence and correctness ONLY after readiness.
 * 4. Atomic file operations (indirectly via presence of final file).
 */
import net from 'net';
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';
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
async function fetchHeartbeat(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/call/heartbeat`, (res) => {
            resolve(res.statusCode === 200);
            res.resume();
        });
        req.on('error', () => resolve(false));
        req.setTimeout(500, () => {
            req.destroy();
            resolve(false);
        });
    });
}
// ── test ───────────────────────────────────────────────────────────────────
async function runTest() {
    const PREFERRED = 18088;
    let blocker = null;
    let system = null;
    const portsFile = path.join(__dirname, 'ResilienceEntity.ports.json');
    console.log('--- KrnlTS Port Resilience & Readiness Test ---');
    try {
        // 1. Block the preferred port
        blocker = await occupyPort(PREFERRED);
        console.log(`[test] Blocker holding port ${PREFERRED}`);
        // 2. Instantiate system
        system = new krnlSystemEntityBase('ResilienceEntity', null, PREFERRED, '0.0.0.0', {
            sourcePath: import.meta.url,
        });
        // Verify snapshot doesn't exist yet
        assert.strictEqual(fs.existsSync(portsFile), false, "Snapshot should not exist before bind.");
        console.log(`[test] ✓ Snapshot file absent before startup.`);
        // 3. Start discovery (which starts server) but don't await it immediately
        const startPromise = system.startDiscovery();
        // 4. Await readiness
        console.log(`[test] Awaiting system.whenReady()...`);
        await system.whenReady();
        console.log(`[test] ✓ System signaled readiness.`);
        const actual = system.commPort;
        // 5. Assert port fallback
        assert.notStrictEqual(actual, PREFERRED, `FAIL: Should have fallen back from ${PREFERRED}`);
        assert.strictEqual(actual >= PREFERRED, true, `FAIL: Actual port ${actual} should be >= ${PREFERRED}`);
        console.log(`[test] ✓ Port fell back to authoritative: ${actual}`);
        // 6. Assert Snapshot File Correctness
        assert.strictEqual(fs.existsSync(portsFile), true, "Snapshot file must exist after ready.");
        const snapshot = JSON.parse(fs.readFileSync(portsFile, 'utf8'));
        assert.strictEqual(snapshot.ports['_krnl_system'], actual, "Snapshot port mismatch.");
        console.log(`[test] ✓ Snapshot file exists and contains correct port.`);
        // 7. Assert Connectivity (Health Endpoint)
        const healthy = await fetchHeartbeat(actual);
        assert.strictEqual(healthy, true, "Heartbeat should be reachable on finalized port.");
        console.log(`[test] ✓ Heartbeat endpoint reachable on authoritative port.`);
        // 8. Assert internal registry consistency
        const regPort = system.portRegistry.get('_krnl_system');
        assert.strictEqual(regPort, actual, "Registry mismatch.");
        console.log(`[test] ✓ Internal registry matches authoritative port.`);
        // Cleanup system
        await startPromise; // Ensure full discovery startup loop finishes (beacon etc)
        console.log('\n--- SUCCESS: Resilience & Readiness verification passed ---\n');
    }
    catch (err) {
        console.error('\n!!! TEST FAILED !!!');
        console.error(err);
        process.exit(1);
    }
    finally {
        if (system) {
            await system.gracefulShutdown();
        }
        if (blocker) {
            await closeServer(blocker);
        }
        // Final cleanup of any orphaned files
        [portsFile].forEach(f => {
            if (fs.existsSync(f))
                fs.unlinkSync(f);
        });
    }
}
runTest();
//# sourceMappingURL=port_resilience_v2.test.js.map