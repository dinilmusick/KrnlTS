import { describe, it, expect, vi } from 'vitest';
import { KrnlQueue } from '../orchestration/canonical/KrnlQ.js';
import { KrnlWorkerPool } from '../orchestration/canonical/KrnlWorkerPool.js';

describe('KrnlQ (In-process Service Queue Engine)', () => {
  it('enqueues and executes jobs in FIFO order by default with worker context', async () => {
    const queue = new KrnlQTestQueue('test_fifo_queue');
    const order: number[] = [];

    const handle1 = queue.enqueue({
      name: 'job1',
      payload: 1,
      handler: async (val, ctx) => {
        expect(ctx.isWorkerContext).toBe(true);
        expect(ctx.workerId).toBeTruthy();
        order.push(val);
        return val * 10;
      },
    });

    const handle2 = queue.enqueue({
      name: 'job2',
      payload: 2,
      handler: async (val, ctx) => {
        expect(ctx.isWorkerContext).toBe(true);
        order.push(val);
        return val * 10;
      },
    });

    const [res1, res2] = await Promise.all([handle1.result(), handle2.result()]);
    expect(res1).toBe(10);
    expect(res2).toBe(20);
    expect(order).toEqual([1, 2]);

    await queue.shutdown();
  });

  it('respects priority ordering (higher priority executed first)', async () => {
    const queue = new KrnlQueue({ queueName: 'test_priority_queue', concurrency: 1, autoStart: false });
    const order: string[] = [];

    const lowJob = queue.enqueue({
      name: 'low',
      payload: 'low',
      options: { priority: 0 },
      handler: async (val) => {
        order.push(val);
        return val;
      },
    });

    const highJob = queue.enqueue({
      name: 'high',
      payload: 'high',
      options: { priority: 10 },
      handler: async (val) => {
        order.push(val);
        return val;
      },
    });

    queue.resume();

    await Promise.all([lowJob.result(), highJob.result()]);
    expect(order).toEqual(['high', 'low']);

    await queue.shutdown();
  });

  it('handles job retries with backoff on failure', async () => {
    const queue = new KrnlQueue({ queueName: 'test_retry_queue' });
    let attempts = 0;

    const handle = queue.enqueue({
      name: 'failing_job',
      payload: 'data',
      options: { retries: 2, backoffMs: 10 },
      handler: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Transient error');
        }
        return 'recovered';
      },
    });

    const res = await handle.result();
    expect(res).toBe('recovered');
    expect(attempts).toBe(3);
    expect(handle.getStatus()).toBe('completed');

    await queue.shutdown();
  });

  it('handles job cancellation via handle and AbortSignal', async () => {
    const queue = new KrnlQueue({ queueName: 'test_cancel_queue', concurrency: 1 });
    
    // Block the queue with a slow job
    const blocker = queue.enqueue({
      name: 'blocker',
      payload: null,
      handler: async () => {
        await new Promise((r) => setTimeout(r, 50));
      },
    });

    // Enqueue job to cancel
    const toCancel = queue.enqueue({
      name: 'toCancel',
      payload: 'never_run',
      handler: async (val) => val,
    });

    const cancelled = toCancel.cancel();
    expect(cancelled).toBe(true);
    expect(toCancel.getStatus()).toBe('cancelled');

    await expect(toCancel.result()).rejects.toThrow(/aborted/);
    await blocker.result();
    await queue.shutdown();
  });

  it('enforces idempotency key reuse', async () => {
    const queue = new KrnlQueue({ queueName: 'test_idem_queue' });
    let executions = 0;

    const run = async () => {
      const handle = queue.enqueue({
        name: 'idempotent_job',
        payload: { x: 42 },
        options: { idempotencyKey: 'key_123' },
        handler: async (p) => {
          executions++;
          return p.x * 2;
        },
      });
      return await handle.result();
    };

    const first = await run();
    const second = await run();

    expect(first).toBe(84);
    expect(second).toBe(84);
    expect(executions).toBe(1);

    await queue.shutdown();
  });

  it('times out when job exceeds configured timeoutMs', async () => {
    const queue = new KrnlQueue({ queueName: 'test_timeout_queue' });

    const handle = queue.enqueue({
      name: 'slow_job',
      payload: null,
      options: { timeoutMs: 30 },
      handler: async () => {
        await new Promise((r) => setTimeout(r, 100));
        return 'done';
      },
    });

    await expect(handle.result()).rejects.toThrow(/timed out/);
    expect(handle.getStatus()).toBe('failed');

    await queue.shutdown();
  });
});

class KrnlQTestQueue extends KrnlQueue {
  constructor(name: string) {
    super({ queueName: name });
  }
}
