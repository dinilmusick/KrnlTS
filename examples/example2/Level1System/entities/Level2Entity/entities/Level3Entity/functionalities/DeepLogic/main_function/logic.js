export const logic = (input, ctx) => {
    ctx.state.calls = (ctx.state.calls || 0) + 1;
    return `Deep logic reached! Total calls: ${ctx.state.calls}. Input: ${input.data}`;
};
