import { AccessControlSystem } from "./AccessControlSystem/AccessControlSystem.js";

async function run() {
    const system = new AccessControlSystem(10200);
    console.log("--- Starting AccessControlSystem Test ---");

    const tests = [
        { id: 'internal', port: 3001, key: null, expect: 'success' },
        { id: 'internal', port: 8001, key: null, expect: 'error' },
        { id: 'free', port: 8001, key: null, expect: 'success' },
        { id: 'keyed', port: 8001, key: null, expect: 'error' },
        { id: 'keyed', port: 8001, key: 'my-secret-key', expect: 'success' },
        { id: 'mixed', port: 8001, key: null, expect: 'success' },
        { id: 'mixed', port: 4001, key: null, expect: 'error' },
        { id: 'mixed', port: 4001, key: 'mixed-secret', expect: 'success' },
        { id: 'mixed', port: 9991, key: null, expect: 'error' },
        { id: 'mixed', port: 5555, key: null, expect: 'error' },
        { id: 'unlisted-allowed', port: 5555, key: null, expect: 'success' },
    ];

    let passed = 0;
    for (const t of tests) {
        console.log(`Testing ${t.id} from port ${t.port} (key: ${t.key}) -> Expect: ${t.expect}`);
        let result;
        try {
            result = await system.call(t.id, {}, { callerPort: t.port, accessKey: t.key, unwrap: false });
        } catch (e) {
            result = e; // The system.call throws on error
        }

        const success = (t.expect === 'success' && result.status === 'success') || 
                        (t.expect === 'error' && (result.status === 'error' || result.message.includes('AccessDenied')));
        
        if (success) {
            console.log("  ✅ PASS");
            passed++;
        } else {
            console.error(`  ❌ FAIL: Result: ${JSON.stringify(result)}`);
        }
    }

    console.log(`\nPassed ${passed}/${tests.length} tests.`);
    system.dispose();
    process.exit(passed === tests.length ? 0 : 1);
}

run().catch(console.error);
