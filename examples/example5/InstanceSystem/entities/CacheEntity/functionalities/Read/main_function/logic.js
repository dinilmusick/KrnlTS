export const main = async (input, { state, entity }) => {
    state.reads += 1;
    return { cache: entity.entityName, reads: state.reads };
};
