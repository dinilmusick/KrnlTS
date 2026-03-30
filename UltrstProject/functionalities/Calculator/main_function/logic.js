// UltrstProject/functionalities/Calculator/main_function/logic.js
// The "Main Function" Atom: Pure logic.
export const main = async (input, { state, helpers, emitters }) => {
    const { a, b, op } = input;
    let result = 0;

    if (op === 'add') result = a + b;
    else if (op === 'sub') result = a - b;

    // Use a helper atom
    const formatted = helpers.get('format')(result);
    
    // Push to an event atom
    emitters.get('onCalculated').pushDataStreamToEmitter({ result, formatted });

    return result;
};
