import { App1 } from "./DynamicPortSystem/App1.js";
import { App2 } from "./DynamicPortSystem/App2.js";

async function runTest(sequence) {
    console.log(`\n--- Running Sequence: ${sequence} ---`);
    let app1, app2;
    if (sequence === 'App1First') {
        app1 = new App1(11000);
        await app1.start();
        app2 = new App2(11050);
        await app2.start();
    } else {
        app2 = new App2(11050);
        await app2.start();
        app1 = new App1(11000);
        await app1.start();
    }
    
    console.log(`[Test] Sequence ${sequence} completed successfully.`);
    app1.dispose();
    app2.dispose();
}

async function main() {
    await runTest('App1First');
    await runTest('App2First');
    console.log("\n✅ Resilience Test Passed!");
}

main().catch(console.error);
