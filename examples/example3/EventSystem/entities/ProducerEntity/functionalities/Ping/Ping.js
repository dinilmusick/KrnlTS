import { logic } from "./main_function/logic.js";

export const PingAtom = {
    id: "Ping",
    visibility: "public",
    stateModel: "single",
    initialState: { seq: 0 },
    api: logic,
    emitters: {
        "ping-emitted": {}
    }
};
