import { logic } from "./main_function/logic.js";

export const LoggerAtom = {
    id: "Logger",
    visibility: "public",
    stateModel: "single",
    initialState: { logs: [] },
    api: logic
};
