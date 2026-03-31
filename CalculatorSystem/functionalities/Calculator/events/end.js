// UltrstProject/functionalities/Calculator/events/end.js
// An "Event" Atom: Code that runs at the completion of the logic.
export const end = ({ output }) => {
    console.log(`[Calculator] Logic Finished. Result: ${output}`);
};
