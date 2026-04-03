export const main = async (input, { state, emitters }) => {
    state.calls += 1;
    const payload = { from: "Leaf", calls: state.calls, input };
    emitters.get("leaf-event").pushDataStreamToEmitter(payload);
    return payload;
};
