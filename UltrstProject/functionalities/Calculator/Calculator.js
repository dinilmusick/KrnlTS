// UltrstProject/functionalities/Calculator/Calculator.js
// The Functionality Assembler: Imports and binds all atoms.

import { main } from "./main_function/logic.js";
import { format } from "./helper_functions/formatter.js";
import { beginning } from "./events/beginning.js";
import { end } from "./events/end.js";

export const CalculatorAtom = {
    id: "Calculator",
    visibility: "public",
    stateModel: "single",
    initialState: { lastResult: 0 },
    api: main,
    helpers: { format },
    events: {
        beginning,
        end
    },
    emitters: {
        onCalculated: {}
    }
};
