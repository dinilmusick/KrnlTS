import { main } from "./main_function/logic.js";
import { mechanismDemoInitialState } from "./state_data/state.js";

// Descriptor only: no logic/data definitions by policy.
export const RunMechanismDemoAtom = {
    id: "RunMechanismDemo",
    visibility: "private",
    initialState: mechanismDemoInitialState,
    api: main
};
