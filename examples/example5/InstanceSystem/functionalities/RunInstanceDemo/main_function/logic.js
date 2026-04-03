import { WorkerEntity } from "../../../entities/WorkerEntity/WorkerEntity.js";
import { CacheEntity } from "../../../entities/CacheEntity/CacheEntity.js";

export const main = async (input, { state, entity }) => {
    state.runs += 1;

    const cache1 = entity.hierarchyManager.createComponentEntity("Cache", CacheEntity);
    const cache2 = entity.hierarchyManager.createComponentEntity("Cache", CacheEntity);

    const worker1 = entity.hierarchyManager.createComponentEntity("Worker", WorkerEntity);
    const worker2 = entity.hierarchyManager.createComponentEntity("Worker", WorkerEntity);

    const worker1Result = await worker1.call("Handle", { task: "A" });
    const worker2Result = await worker2.call("Handle", { task: "B" });

    const cacheResult = await cache1.call("Read", {});

    const disposed = entity.disposeOwnedComponent(worker1.entityName);
    const remainingWorkers = entity.hierarchyManager.getOwnedComponentEntitiesByName("Worker").map((w) => w.entityName);

    return {
        run: state.runs,
        singletonCacheSameInstance: cache1 === cache2,
        workerInstances: [worker1.entityName, worker2.entityName],
        worker1Result,
        worker2Result,
        cacheResult,
        disposed,
        remainingWorkers,
    };
};
