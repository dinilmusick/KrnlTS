// examples/example1/CalculatorSystem/entities/Logger/functionalities/Audit/Audit.js
import { main } from "./main_function/logic.js";

export const AuditAtom = {
    id: "Audit",
    visibility: "public", // Needs to be public so owner can wire to it
    api: main
};
