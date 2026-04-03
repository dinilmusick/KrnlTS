import { main } from "./main_function/logic.js";
import { workerHandleInitialState } from "./state_data/state.js";

export const HandleAtom = {
    id: "Handle",
    visibility: "public",
    initialState: workerHandleInitialState,
    api: main
};
