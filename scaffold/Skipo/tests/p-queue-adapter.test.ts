import { describe, expect, it } from "vitest";
import { PQueueAdapter } from "../scaffolds/vite/src/libraries/skipo/systems/execution/PQueueAdapter";
import type { ExecutionJob } from "../scaffolds/vite/src/libraries/skipo/systems/execution/types";

function job(id: string, priority: ExecutionJob["priority"] = "NORMAL"): ExecutionJob {
  return {
    id,
    command: { id, type: "TEST", payload: { id } },
    priority,
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    createdAt: Date.now(),
    status: "QUEUED",
  };
}

describe("PQueueAdapter", () => {
  it("bounds concurrent command execution and records terminal status", async () => {
    let active = 0;
    let peak = 0;
    const adapter = new PQueueAdapter({ queueName: "test", maxConcurrency: 2 }, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    });

    const ids = Array.from({ length: 6 }, (_, index) => adapter.enqueue(job(`job-${index}`)));
    await adapter.onIdle();

    expect(peak).toBe(2);
    expect(ids.map((id) => adapter.getJobStatus(id))).toEqual(Array(6).fill("COMPLETED"));
    await adapter.close();
    expect(() => adapter.enqueue(job("after-close"))).toThrow(/closed/);
  });

  it("retries failed handlers using the job retry policy", async () => {
    let attempts = 0;
    const adapter = new PQueueAdapter({ queueName: "retry", maxConcurrency: 1 }, async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("transient");
      return "ok";
    });
    const id = adapter.enqueue({
      ...job("retry-job"),
      retryPolicy: { maxAttempts: 2, backoffMs: 0 },
    });

    await adapter.onIdle();

    expect(attempts).toBe(2);
    expect(adapter.getJobStatus(id)).toBe("COMPLETED");
    expect(adapter.getJobResult(id)).toBe("ok");
    await adapter.close();
  });

  it("runs higher-priority waiting commands first", async () => {
    let release!: () => void;
    const blocker = new Promise<void>((resolve) => { release = resolve; });
    const order: string[] = [];
    const adapter = new PQueueAdapter({ queueName: "priority", maxConcurrency: 1 }, async (item) => {
      const id = String(item.command.payload.id);
      if (id === "blocker") await blocker;
      else order.push(id);
    });

    adapter.enqueue(job("blocker"));
    await Promise.resolve();
    adapter.enqueue(job("low", "LOW"));
    adapter.enqueue(job("high", "HIGH"));
    release();
    await adapter.onIdle();

    expect(order).toEqual(["high", "low"]);
    await adapter.close();
  });
});
