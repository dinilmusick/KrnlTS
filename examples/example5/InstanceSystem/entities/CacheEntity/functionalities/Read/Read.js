import { main } from "./main_function/logic.js";
import { cacheReadInitialState } from "./state_data/state.js";

export const ReadAtom = {
    id: "Read",
    visibility: "public",
    initialState: cacheReadInitialState,
    api: main
};
