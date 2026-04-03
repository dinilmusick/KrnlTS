import { logic } from "./main_function/logic.js";
import { pingInitialState } from "./state_data/state.js";

export const PingAtom = {
    id: "Ping",
    visibility: "public",
    initialState: pingInitialState,
    api: logic,
    emitters: {
        "ping-emitted": {}
    }
};
