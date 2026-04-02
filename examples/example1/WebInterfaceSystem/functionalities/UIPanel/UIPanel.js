// WebInterfaceSystem/functionalities/UIPanel/UIPanel.js
import { main } from "./main_function/logic.js";

export const UIPanelAtom = {
    id: "UIPanel",
    visibility: "public",
    stateModel: "single",
    api: main
};
