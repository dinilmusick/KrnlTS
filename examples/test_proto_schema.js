import { krnlSystemEntityBase, krnlProto } from "../dist/index.js";

async function run() {
    console.log("--- Starting KrnlJS Protobuf Schema Test ---");

    const system = new krnlSystemEntityBase("ProtoSchemaTestSystem", null, 10102);

    // Register a functionality with Protobuf (RpcResponse) schema
    system.addLocal({
        id: "saveResponse",
        schema: {
            input: krnlProto.RpcResponse
        },
        api: async (payload) => {
            console.log("API Invoked with payload:", JSON.stringify(payload, null, 2));
            return { ok: true };
        }
    });

    console.log("\n[TEST 1] Calling with VALID input...");
    try {
        const res = await system.call("saveResponse", {
            requestId: "123",
            ok: true,
            jsonResult: JSON.stringify({ data: "yes" })
        });
        console.log("SUCCESS:", JSON.stringify(res, null, 2));
    } catch (err) {
        console.error("FAILED unexpectedly:", err.message);
    }

    console.log("\n[TEST 2] Calling with INVALID input (wrong field type)...");
    try {
        // ok should be boolean, we pass a object/array
        await system.call("saveResponse", {
            requestId: "123",
            ok: "should_be_boolean_but_is_string"
        });
        console.error("FAILED: Should have blocked invalid input!");
    } catch (err) {
        console.log("SUCCESS: Blocked invalid input as expected:", err.message);
    }

    system.dispose();
    process.exit(0);
}

run();
