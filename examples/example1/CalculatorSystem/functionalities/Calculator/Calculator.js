// UltrstProject/functionalities/Calculator/Calculator.js
// The Functionality Descriptor: Strictly for assembly configuration.

import { main } from "./main_function/logic.js";
import { calculatorInitialState } from "./state_data/state.js";

export const CalculatorAtom = {
    id: "Calculator",
    visibility: "public",
    initialState: calculatorInitialState,
    api: main, // Logic is self-contained and imports its own helpers/events.
    emitters: {
        onCalculated: {}
    }
};
