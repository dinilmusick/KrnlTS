export const main = async (input, { state, entity }) => {
    state.runs += 1;

    const directLeaf = entity.hierarchyManager
        .getAllOwnedComponentEntities()[0]
        ?.hierarchyManager
        .getAllOwnedComponentEntities()[0];

    const leafEventEmitter = directLeaf.interface.getEmitter("LeafAction:leaf-event");

    const streamCollector = entity.interface.createCollector(`stream-${state.runs}`);
    const onceCollector = entity.interface.createCollector(`once-${state.runs}`);

    let streamCount = 0;
    streamCollector.subscribeTo(leafEventEmitter, () => {
        streamCount += 1;
    });

    let onceCount = 0;
    onceCollector.subscribeTo(leafEventEmitter, () => {
        onceCount += 1;
    }, { mode: "once" });

    await directLeaf.call("LeafAction", { mode: "stream-and-once-1" });
    await directLeaf.call("LeafAction", { mode: "stream-and-once-2" });

    const nextCollector = entity.interface.createCollector(`next-${state.runs}`);
    const waitNext = nextCollector.collectNext(leafEventEmitter, 1000);
    await directLeaf.call("LeafAction", { mode: "collect-next" });
    const nextMessage = await waitNext;

    let topLevelBlocked = false;
    try {
        await entity.call("LeafAction", { test: "top-level" });
    } catch {
        topLevelBlocked = true;
    }

    return {
        run: state.runs,
        streamCount,
        onceCount,
        nextMessage: nextMessage.data,
        topLevelBlocked
    };
};
