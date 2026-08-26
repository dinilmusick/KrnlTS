import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";

export class KrnlEndpointScheduler {
  private tracker: KrnlWatchVariablesTracker;
  private executing: Set<string> = new Set();
  private queue: Array<{
    endpointId: string;
    task: () => Promise<any>;
    resolve: (val: any) => void;
    reject: (err: any) => void;
  }> = [];

  constructor(tracker: KrnlWatchVariablesTracker) {
    this.tracker = tracker;
  }

  async dispatch(endpointId: string, task: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ endpointId, task, resolve, reject });
      this.drainQueue();
    });
  }

  private hasConflict(endpointId: string): boolean {
    for (const activeEndpoint of this.executing) {
      const shared = this.tracker.sharedDynamicVars(endpointId, activeEndpoint);
      if (shared.length > 0) {
        return true;
      }
    }
    return false;
  }

  private release(endpointId: string): void {
    this.executing.delete(endpointId);
    this.drainQueue();
  }

  private drainQueue(): void {
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
