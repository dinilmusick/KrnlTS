import { krnlSystemEntityBase } from "../dist/index.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

async function run() {
    console.log("--- Starting KrnlJS Zod Schema Test ---");

    const system = new krnlSystemEntityBase("SchemaTestSystem", null, 10101);

    // 1. Register a functionality with Zod input and output schemas
    system.addLocal({
        id: "calculate",
        schema: {
            input: z.object({
                a: z.number(),
                b: z.number(),
                op: z.enum(["add", "sub", "mul", "div"])
            }),
            output: z.object({
                result: z.number(),
                meta: z.object({
                    time: z.string()
                })
            })
        },
        api: async ({ a, b, op }) => {
            let res = 0;
            if (op === "add") res = a + b;
            if (op === "sub") res = a - b;
            if (op === "mul") res = a * b;
            if (op === "div") res = a / b;

            return {
                result: res,
                meta: { time: new Date().toISOString() }
            };
        }
    });

    console.log("\n[TEST 1] Calling with VALID input...");
    try {
        const res = await system.call("calculate", { a: 10, b: 5, op: "add" });
        console.log("SUCCESS:", JSON.stringify(res, null, 2));
    } catch (err) {
        console.error("FAILED unexpectedly:", err.message);
    }

    console.log("\n[TEST 2] Calling with INVALID input (missing field)...");
    try {
        const res2 = await system.call("calculate", { a: 10, op: "add" });
        console.error("FAILED: Should have blocked invalid input!");
    } catch (err) {
        console.log("SUCCESS: Blocked invalid input as expected:", err.message);
    }

    console.log("\n[TEST 3] Calling with INVALID input (wrong type)...");
    try {
        const res3 = await system.call("calculate", { a: 10, b: "5", op: "add" });
        console.error("FAILED: Should have blocked invalid input!");
    } catch (err) {
        console.log("SUCCESS: Blocked invalid input as expected:", err.message);
    }

    console.log("\n[TEST 4] Testing MANIFEST generation...");
    const manifest = system.getManifest();
    console.log("Manifest for 'calculate':", JSON.stringify(manifest.inputs.api.calculate, null, 2));

    const localSchema = zodToJsonSchema(z.object({ a: z.number() }), "mySchema");
    console.log("Local zodToJsonSchema test:", JSON.stringify(localSchema, null, 2));

    if (manifest.inputs.api.calculate.schema && manifest.inputs.api.calculate.schema.input) {
        console.log("SUCCESS: Schema found in manifest.");
    } else {
        console.error("FAILED: Schema missing from manifest!");
    }

    system.dispose();
    process.exit(0);
}

run();
