export const main = async (input, { state, entity }) => {
    state.jobs += 1;
    return { worker: entity.entityName, jobs: state.jobs, input };
};
