import { CalculatorSystem } from "./CalculatorSystem/CalculatorSystem.js";

async function main() {
    const calc = new CalculatorSystem(10091);
    await calc.startDiscovery();
    console.log("CalculatorSystem started. Waiting 5s...");
    setTimeout(() => {
        calc.dispose();
        process.exit(0);
    }, 5000);
}

main().catch(console.error);
