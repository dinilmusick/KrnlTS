export class KrnlEndpointScheduler {
    tracker;
    executing = new Set();
    queue = [];
    constructor(tracker) {
        this.tracker = tracker;
    }
    async dispatch(endpointId, task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ endpointId, task, resolve, reject });
            this.drainQueue();
        });
    }
    hasConflict(endpointId) {
        for (const activeEndpoint of this.executing) {
            const shared = this.tracker.sharedDynamicVars(endpointId, activeEndpoint);
            if (shared.length > 0) {
                return true;
            }
        }
        return false;
    }
    release(endpointId) {
        this.executing.delete(endpointId);
        this.drainQueue();
    }
    drainQueue() {
        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            if (!this.hasConflict(item.endpointId)) {
                // Remove from queue
                this.queue.splice(i, 1);
                i--; // Adjust index due to deletion
                this.executing.add(item.endpointId);
                // Execute task
                item.task()
                    .then(res => {
                    item.resolve(res);
                    this.release(item.endpointId);
                })
                    .catch(err => {
                    item.reject(err);
                    this.release(item.endpointId);
                });
            }
        }
    }
}
//# sourceMappingURL=K_LIB_Krnl_Endpoint_Scheduler.js.map