export const logic = (input, ctx) => {
    console.log(`[Consumer Logger] Received Event:`, input);
    ctx.state.logs = ctx.state.logs || [];
    ctx.state.logs.push(input);
    return true;
};
