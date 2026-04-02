// examples/example3/EventSystem/functionalities/RunScenario/RunScenario.js
import { main } from "./main_function/logic.js";

export const RunScenarioAtom = {
    id: "RunScenario",
    visibility: "private", // Internal to the system
    api: main
};
