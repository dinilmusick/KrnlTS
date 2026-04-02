// examples/example2/Level1System/functionalities/TestNesting/main_function/logic.js
export const main = async (input, { entity }) => {
    console.log("[Level1System] Testing 3-level nesting call...");
    
    // Wait for components to boot and promote
    await new Promise(r => setTimeout(r, 500));

    try {
        const result = await entity.call("DeepLogic", { data: "Hello from Level 1" });
        console.log("[Level1System] Result:", result);
        return result;
    } catch (e) {
        console.error("[Level1System] Call failed:", e.message);
        throw e;
    }
};
