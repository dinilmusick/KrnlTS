import { main } from "./main_function/logic.js";
import { runInstanceDemoInitialState } from "./state_data/state.js";

export const RunInstanceDemoAtom = {
    id: "RunInstanceDemo",
    visibility: "private",
    initialState: runInstanceDemoInitialState,
    api: main
};
