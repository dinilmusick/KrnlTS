import { krnlEntityBase, krnlSystemEntityBase } from "../../dist/index.js";
import { z } from "zod";

class ChildComponent extends krnlEntityBase {
    constructor(owner) {
        super("ChildComponent", owner);

        this.addLocal({
            id: "calculateAge",
            schema: {
                input: z.object({
                    birthYear: z.number().min(1900).max(2026)
                })
            },
            description: "Calculates age from birth year",
            method: "GET",
            api: async ({ birthYear }) => {
                return { age: 2026 - birthYear };
            }
        });
    }
}

class ParentSystem extends krnlSystemEntityBase {
    constructor() {
        // Use a unique port 10103 to avoid EADDRINUSE conflict
        super("ParentSystem", null, 10103);
        this.addChild(new ChildComponent(this));
    }
}

async function main() {
    console.log("--- Starting Bubbled-Up Functionality Unified Protocol Test ---");
    const system = new ParentSystem();

    // 1. Verify getManifest()
    console.log("\n[TEST 1] Verifying getManifest() has full schemas for bubbled remote functionalities...");
    const manifest = system.getManifest();
    const calculateAgeApi = manifest.inputs.api.calculateAge;

    if (!calculateAgeApi) {
        console.error("❌ FAILED: calculateAge is missing from manifest!");
        process.exit(1);
    }
    console.log("Found api metadata in manifest:", JSON.stringify(calculateAgeApi, null, 2));
    if (calculateAgeApi.type === "remote" && calculateAgeApi.schema && calculateAgeApi.schema.input) {
        console.log("✅ SUCCESS: Remote bubbled-up functionality contains rich Zod input schema!");
    } else {
        console.error("❌ FAILED: Schema was not populated for remote functionality!");
        process.exit(1);
    }

    // 2. Verify MCP listTools()
    console.log("\n[TEST 2] Verifying MCP listTools() resolves schema and description for bubbled functionalities...");
    const mcpTools = await system.unifiedHttpAdapter.mcp.listTools();
    const ageTool = mcpTools.tools.find(t => t.name === "calculateAge");

    if (!ageTool) {
        console.error("❌ FAILED: calculateAge tool is missing from MCP list!");
        process.exit(1);
    }
    console.log("Found MCP tool entry:", JSON.stringify(ageTool, null, 2));
    if (ageTool.description === "Calculates age from birth year" && ageTool.inputSchema.properties.data) {
        console.log("✅ SUCCESS: MCP tool correctly resolved description and schema!");
    } else {
        console.error("❌ FAILED: MCP tool resolver did not enrich description or inputSchema!");
        process.exit(1);
    }

    // 3. Verify SSE resolver
    console.log("\n[TEST 3] Verifying SSE resolver retrieves the underlying local functionality...");
    const sseFunc = system.resolveLocalFunctionality("calculateAge");
    if (sseFunc && sseFunc.isLocal) {
        console.log("✅ SUCCESS: Successfully resolved local functionality from bubbled proxy!");
        console.log(`Resolved ID: ${sseFunc.id}, description: "${sseFunc.description || 'Calculates age from birth year'}"`);
    } else {
        console.error("❌ FAILED: Could not resolve underlying local functionality!");
        process.exit(1);
    }

    system.dispose();
    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
    process.exit(0);
}

main().catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
