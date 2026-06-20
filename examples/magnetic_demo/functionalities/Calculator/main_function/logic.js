export const main = async (input, { state, emitters }) => {
    // Call helper and event globally without importing them!
    beginning("Calculator");
    const { a, b } = input || { a: 0, b: 0 };
    const sum = a + b;
    const formattedResult = format(sum);
    console.log(`[Calculator Logic] Result formatted: ${formattedResult}`);
    return { sum, formattedResult };
};
