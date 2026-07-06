import { EventEmitter } from 'events';
// CalculatorSystem/functionalities/Calculator/main_function/logic.js
import { format } from "../helper_functions/formatter.js";
import { beginning } from "../events/beginning.js";
import { end } from "../events/end.js";

/**
 * MAIN LOGIC ATOM
 * Demonstrates surgical imports and event triggering.
 */
export const main = async (input, {
  state,
  emitters,
  functionality
}) => {
  // 1. Trigger 'beginning' event
  beginning({
    functionality
  });
  const {
    a,
    b,
    op
  } = input;

  // 2. Trigger 'during' event (processing signal)
  this.emitter.emit('onCalculated', {
    status: "processing",
    op
  });

  // 3. Perform calculation and update state (triggers Proxy)
  let result = 0;
  if (op === 'add') result = a + b;else if (op === 'sub') result = a - b;
  state.lastResult = result; // Triggers 'state:changed' emitter

  // 3. Use helper for formatting
  const formatted = format(result);

  // 4. Trigger 'onCalculated' event with final data
  this.emitter.emit('onCalculated', {
    status: "complete",
    result,
    formatted,
    timestamp: Date.now()
  });

  // 5. Trigger 'end' event
  end({
    output: result
  });
  return result;
};