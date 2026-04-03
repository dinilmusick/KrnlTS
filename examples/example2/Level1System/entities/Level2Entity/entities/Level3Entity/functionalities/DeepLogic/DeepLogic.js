// examples/example2/Level1System/entities/Level2Entity/entities/Level3Entity/functionalities/DeepLogic/DeepLogic.js

import { main } from "./main_function/logic.js";

/**
 * FUNCTIONALITY ASSEMLER: DeepLogic
 * -------------------------------------------------------------------------
 * This defines the visibility for the deep logic.
 * Visibility: 'public' means it will bubble up to Level 2.
 */
export const DeepLogic = {
    id: "DeepLogic",
    visibility: "public", // This is the default. It starts the bubbling chain.
    api: main
    
    /**
     * ALTERNATIVE CONFIGURATION:
     * To hide this logic from Level 2 and Level 1 immediately:
     * visibility: "private"
     */
};
