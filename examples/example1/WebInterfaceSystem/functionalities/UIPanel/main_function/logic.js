// WebInterfaceSystem/functionalities/UIPanel/main_function/logic.js
export const main = async (input, { entity }) => {
    const { a, b, op } = input;
    console.log(`[WebUI] Requesting ${op} for ${a} and ${b}...`);

    // In a real UI, this would call the CalculatorSystem via wire()
    // For the demo, we assume the system orchestrator handles the wiring.
    // The call bubbles through the remote proxy.
    const result = await entity.call("RemoteCalc", { a, b, op });
    
    return {
        status: "success",
        result: result,
        message: `Calculated via remote system: ${result}`
    };
};
