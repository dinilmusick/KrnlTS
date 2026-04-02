// examples/example3/EventSystem/functionalities/RunScenario/main_function/logic.js
export const main = async (input, { entity }) => {
    console.log("[EventSystem] Running scenario: Producer will emit events, Consumer will log them.");
    
    // Trigger the Producer's Ping logic (bubbled to system level)
    for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 1000));
        console.log(`[EventSystem] Triggering Ping ${i+1}...`);
        await entity.call("Ping", { some: "data" });
    }
    return "Scenario complete.";
};
