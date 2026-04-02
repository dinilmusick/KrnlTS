import { logic } from "./main_function/logic.js";

export const DeepLogic = {
    id: "DeepLogic",
    visibility: "public",
    stateModel: "single",
    initialState: { calls: 0 },
    api: logic
};
