export const logic = (input, ctx) => {
    const data = { msg: "Ping!", timestamp: Date.now(), seq: (ctx.state.seq || 0) + 1 };
    ctx.state.seq = data.seq;
    
    // Emit the event through the functionality's emitter
    ctx.emitters.get("ping-emitted").pushDataStreamToEmitter(data);
    
    return data;
};
