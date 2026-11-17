export class ExecutionQueue {
  private queue: string[] = [];

  enqueue(nodeId: string): void {
    if (!this.queue.includes(nodeId)) {
      this.queue.push(nodeId);
    }
  }

  enqueueMany(nodeIds: string[]): void {
    nodeIds.forEach(id => this.enqueue(id));
  }

  dequeue(): string | undefined {
    return this.queue.shift();
  }

  peek(): string | undefined {
    return this.queue[0];
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }

  getQueue(): string[] {
    return [...this.queue];
  }
}
