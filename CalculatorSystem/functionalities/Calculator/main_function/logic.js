// UltrstProject/functionalities/Calculator/main_function/logic.js

// 1. SURGICAL IMPORTS: Helpers and Events are imported here, not the functionality root.
import { format } from "../helper_functions/formatter.js";
import { beginning } from "../events/beginning.js";
import { end } from "../events/end.js";

// 2. LIBRARY IMPORT: Surgical import from the project root libraries.
import { ProjectConcepts } from "../../../libraries/ProjectConcepts.js";

export const main = async (input, { state, emitters, functionality }) => {
    // Execute 'Beginning' event atom manually if needed or let lifecycle handle it.
    beginning({ functionality });

    const { a, b, op } = input;
    let result = 0;

    if (op === 'add') result = a + b;
    else if (op === 'sub') result = a - b;

    // Use the surgical helper
    const formatted = format(result);
    
    // Log using library concepts
    console.log(`[${ProjectConcepts.PHILOSOPHY}] Logic executing...`);

    // Push to events
    emitters.get('onCalculated').pushDataStreamToEmitter({ result, formatted });

    // Execute 'End' event atom
    end({ output: result });

    return result;
};
