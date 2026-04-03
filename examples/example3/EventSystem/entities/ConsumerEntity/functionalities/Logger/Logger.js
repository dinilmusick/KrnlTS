import { logic } from "./main_function/logic.js";
import { loggerInitialState } from "./state_data/state.js";

export const LoggerAtom = {
    id: "Logger",
    visibility: "public",
    initialState: loggerInitialState,
    api: logic
};
