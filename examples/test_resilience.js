import { krnlSystemEntityBase, KrnlPolicy, Logger } from "../dist/index.js";

async function run() {
    console.log("--- Starting KrnlTS Resilience Test ---");

    const system = new krnlSystemEntityBase("ResilienceTestSystem", null, 10500);
    
    // We attempt to call a system that doesn't exist on a random port
    const nonExistentPort = 9999;
    const policy = new KrnlPolicy({
        maxRetries: 2,
        timeoutMs: 1000,
        retryDelayMs: 500,
        backoffStrategy: "LINEAR"
    });

    console.log(`\n[TEST] Attempting RPC call to localhost:${nonExistentPort} with 2 retries...`);
    const start = Date.now();
    
    try {
        // We create a "virtual" remote entity for the test
        const remote = {
            address: `localhost:${nonExistentPort}`,
            call: async (fid, data, opts) => {
                return await system.commComponent.callWsRpc(`localhost:${nonExistentPort}`, 'call', { fid, data }, opts.policy);
            }
        };

        await remote.call("calculator", { a: 1, b: 2 }, { policy: policy });
        console.error("FAILED: Should not have succeeded!");
    } catch (err) {
        const duration = Date.now() - start;
        console.log(`\nSUCCESS: RPC failed as expected after retries.`);
        console.log(`Error Message: ${err.message}`);
        console.log(`Total Duration: ${duration}ms (Expected ~2000ms: 3 timeouts of 1s each?)`);
        
        // Note: With my current implementation, it waits timeoutMs for connection.
        // If it fails immediately, it retries after retryDelayMs.
        // Let's see the logs.
    }

    system.dispose();
    process.exit(0);
}

run();
