// UltrstProject/functionalities/Calculator/Calculator.js
// The Functionality Descriptor: Strictly for assembly configuration.

import { main } from "./main_function/logic.js";

export const CalculatorAtom = {
    id: "Calculator",
    visibility: "public",
    stateModel: "single",
    initialState: { lastResult: 0 },
    api: main, // Logic is self-contained and imports its own helpers/events.
    emitters: {
        onCalculated: {}
    }
};
