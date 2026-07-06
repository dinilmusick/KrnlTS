// UltrstProject/functionalities/Calculator/Calculator.js
// The Functionality Descriptor: Strictly for assembly configuration.

import { main } from "./main_function/logic.js";
import { onMount, onTeardown } from "./main_function/lifecycle.js";
import { calculatorInitialState } from "./state_data/state.js";
export const CalculatorAtom = {
  id: "Calculator",
  visibility: "public",
  initialState: calculatorInitialState,
  api: main,
  // Logic is self-contained and imports its own helpers/events.
  onMount,
  onTeardown,
  emitters: {
    onCalculated: {}
  },
  schema: {
    input: input => {
      return typeof input.a === 'number' && typeof input.b === 'number' && ['add', 'sub'].includes(input.op);
    }
  }
};