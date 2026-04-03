import { main } from "./main_function/logic.js";
import { leafActionInitialState } from "./state_data/state.js";

// Descriptor only: no logic/data definitions by policy.
export const LeafActionAtom = {
    id: "LeafAction",
    visibility: "public",
    initialState: leafActionInitialState,
    api: main,
    emitters: { "leaf-event": {} }
};
