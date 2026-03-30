// UltrstProject/UltrstProject.js
// The Master Assembler: The top-level Entity file.

import { krnlEntityBase } from "../krnl/core/index.js";

// 1. Import Functionality Atoms
import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";

// 2. Import Library Atoms
import { ProjectConstants } from "./libraries/ProjectConstants.js";

// 3. Import Component Classes (If they need special classes)
// Note: We can also let HierarchyManager spawn generic ones.

export class UltrstProject extends krnlEntityBase {
    constructor(name = "MyUltrstApp") {
        super(name);

        // --- Logic Assembly ---
        this.addLocal(CalculatorAtom);

        // --- Library Registration ---
        this.addLibrary("Constants", ProjectConstants);

        // --- Hierarchy Assembly ---
        // Spawn component from folder /entities/Display/
        this.hierarchyManager.createComponentEntity("Display");

        console.log(`[${this.entityName}] Assembled successfully (v${ProjectConstants.VERSION})`);
    }

    /**
     * Run a test sequence.
     */
    async runDemo() {
        // 1. Call local functionality
        const res = await this.call("Calculator", { a: 10, b: 5, op: "add" });

        // 2. Call promoted component functionality (Display:show)
        await this.call("show", `The result was ${res}`);
    }
}

// --- Bootstrap ---
const app = new UltrstProject();
app.runDemo();
