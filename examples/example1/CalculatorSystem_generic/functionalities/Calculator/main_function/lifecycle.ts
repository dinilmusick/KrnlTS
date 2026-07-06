// CalculatorSystem/functionalities/Calculator/main_function/lifecycle.js

export const onMount = async ({
  state,
  emitters
}) => {
  console.log("[Calculator] Mounted. Initializing resources...");
  state.lastResult = 0;
};
export const onTeardown = async ({
  state
}) => {
  console.log("[Calculator] Tearing down. Cleaning up resources...");
};