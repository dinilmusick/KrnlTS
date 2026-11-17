import { describe, expect, it, vi } from 'vitest';
import { ServiceFacade } from '../services/ServiceFacade.js';
import { FunctionalityOrchestration } from '../orchestration/FunctionalityOrchestration.js';

describe('merged first-class event framework integration', () => {
  it('emits functionality triggered/completed/custom events through the typed namespace and supports unsubscribe', async () => {
    const service = new ServiceFacade({
      id: 'events.integration',
      functionalities: {
        work: {
          events: { finished: { name: 'finished' } },
          execute: async (_input: unknown, context: any) => {
            context.emit('finished', { ok: true });
            return { ok: true };
          },
        },
      },
    });
    await service.start();

    const triggered = vi.fn();
    const completed = vi.fn();
    const finished = vi.fn();
    const channel = service.namespace.functionalities.work.events.finished;
    const subscription = channel.subscribe(finished);
    service.namespace.functionalities.work.events.triggered.subscribe(triggered);
    service.namespace.functionalities.work.events.completed.subscribe(completed);

    await service.call('work', {});
    subscription.unsubscribe();
    await service.call('work', {});

    expect(triggered).toHaveBeenCalledTimes(2);
    expect(completed).toHaveBeenCalledTimes(2);
    expect(finished).toHaveBeenCalledTimes(1);
    await service.dispose();
  });

  it('emits functionality failed and orchestration failed lifecycle events', async () => {
    const failingFunctionality = new ServiceFacade({
      id: 'failure.integration',
      functionalities: {
        fail: { execute: async () => { throw new Error('functionality failure'); } },
      },
    });
    await failingFunctionality.start();
    const failed = vi.fn();
    failingFunctionality.namespace.functionalities.fail.events.failed.subscribe(failed);
    await expect(failingFunctionality.call('fail', {})).rejects.toThrow('functionality failure');
    expect(failed).toHaveBeenCalledTimes(1);
    await failingFunctionality.dispose();

    const orchestration = new FunctionalityOrchestration({ id: 'failureFlow' });
    orchestration.thenFunctionality('fail');
    const service = new ServiceFacade({
      id: 'orch.failure.integration',
      functionalities: { fail: { execute: async () => { throw new Error('orchestration failure'); } } },
      functionalityOrchestrations: { failureFlow: orchestration },
    });
    await service.start();
    const orchFailed = vi.fn();
    service.namespace.functionalityOrchestrations.failureFlow.events.failed.subscribe(orchFailed);
    await expect(service.orchestrate('failureFlow', {})).rejects.toThrow();
    expect(orchFailed).toHaveBeenCalledTimes(1);
    await service.dispose();
  });

  it('bubbles functionality events from orchestration execution without creating duplicate event sources', async () => {
    const orchestration = new FunctionalityOrchestration({ id: 'pipeline' });
    orchestration.thenFunctionality('step');
    const service = new ServiceFacade({
      id: 'bubble.integration',
      functionalities: { step: { execute: async () => ({ ok: true }) } },
      functionalityOrchestrations: { pipeline: orchestration },
    });
    await service.start();
    const triggered = vi.fn();
    const completed = vi.fn();
    service.namespace.functionalities.step.events.triggered.subscribe(triggered);
    service.namespace.functionalities.step.events.completed.subscribe(completed);
    await service.orchestrate('pipeline', {});
    expect(triggered).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledTimes(1);
    await service.dispose();
  });
});
