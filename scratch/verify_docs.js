import { krnlSystemEntityBase } from "../dist/index.js";

async function test() {
    const system = new krnlSystemEntityBase("TestSystem", null, 10095);
    
    // Mock documentation provider
    system.setDocumentationProvider({
        getNextStepsDoc: (fid) => ["Step 1", "Step 2"],
        getDocForEndpoint: (fid) => ({ usage: "How to use " + fid }),
        getDocsForLayer: (layer) => [{ id: "doc1", content: "Main Guide" }]
    });

    system.addLocal({
        id: "testEndpoint",
        api: () => ({ ok: true })
    });

    console.log("--- Calling testEndpoint (Success) ---");
    // Call without unwrapping to see the envelope
    const res = await system.call("testEndpoint", {}, { unwrap: false });
    console.log("Response:", JSON.stringify(res, null, 2));

    console.log("\n--- Calling getLastActionDocs ---");
    const docs = await system.call("getLastActionDocs", {}, { unwrap: false });
    console.log("Docs:", JSON.stringify(docs, null, 2));

    console.log("\n--- Calling getFullDocumentation ---");
    const fullDocs = await system.call("getFullDocumentation", {}, { unwrap: false });
    console.log("Full Docs:", JSON.stringify(fullDocs, null, 2));

    system.dispose();
    process.exit(0);
}

test().catch(console.error);
