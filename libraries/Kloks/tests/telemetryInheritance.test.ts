import { describe, it, expect } from 'vitest';
import {
  ServiceAFacade,
  ServiceBFacade,
  ServiceCFacade,
  ServiceDFacade,
  createServiceB,
  createServiceC,
  ServiceDDefinition,
} from '@kloks/services';
import { FunctionsServiceFacade } from '@kloks/functions';
import {
  AuthServiceFacade,
  StorageServiceFacade,
  WorkspaceServiceFacade,
  ControlPlaneServiceFacade,
} from '@kloks/backend/node';
import { createService } from '@ultrst-armada/krnl';

describe('Kloks Telemetry Inheritance via KrnlTS', () => {
  it('Service A automatically inherits telemetry on both Facade and instances', async () => {
    // 1. Facade level
    expect(ServiceAFacade.telemetry).toBeDefined();
    ServiceAFacade.telemetry.reset();
    ServiceAFacade.telemetry.enable('standard');

    const sum = await ServiceAFacade.execute<{ a: number; b: number }, { result: number }>('add', { a: 12, b: 8 });
    expect(sum.result).toBe(20);

    const snapshot = ServiceAFacade.telemetry.snapshot();
    expect(snapshot.totals.invocationCount).toBeGreaterThanOrEqual(1);
    expect(snapshot.totals.successCount).toBeGreaterThanOrEqual(1);
    expect(snapshot.recentInvocations.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.recentInvocations[0].target).toBe('add');
    expect(snapshot.recentInvocations[0].status).toBe('completed');

    // 2. Created instance level
    const instance = ServiceAFacade.createInstance();
    expect(instance.telemetry).toBeDefined();
    instance.telemetry.enable('detailed');
    await instance.start();
    const mul = await instance.call<{ a: number; b: number }, { result: number }>('multiply', { a: 3, b: 7 });
    expect(mul.result).toBe(21);
    expect(instance.telemetry.snapshot().totals.invocationCount).toBe(1);
  });

  it('Service B automatically inherits telemetry', async () => {
    expect(ServiceBFacade.telemetry).toBeDefined();
    ServiceBFacade.telemetry.reset();
    ServiceBFacade.telemetry.enable('standard');

    const res = await ServiceBFacade.execute<{ delta?: number }, { count: number }>('increment', { delta: 10 });
    expect(res.count).toBeGreaterThanOrEqual(10);

    const snapshot = ServiceBFacade.telemetry.snapshot();
    expect(snapshot.totals.invocationCount).toBeGreaterThanOrEqual(1);

    // Instance check
    const instance = createServiceB();
    expect(instance.telemetry).toBeDefined();
    instance.telemetry.enable('detailed');
    await instance.start();
    await instance.call('increment', { delta: 1 });
    expect(instance.telemetry.snapshot().totals.invocationCount).toBe(1);
  });

  it('Service C automatically inherits telemetry', async () => {
    expect(ServiceCFacade.telemetry).toBeDefined();
    ServiceCFacade.telemetry.reset();
    ServiceCFacade.telemetry.enable('profile');

    const res = await ServiceCFacade.execute<{ metric: string; value: number }, { value: number }>('publishReading', { metric: 'cpu', value: 42 });
    expect(res.value).toBe(42);

    const snapshot = ServiceCFacade.telemetry.snapshot();
    expect(snapshot.totals.invocationCount).toBeGreaterThanOrEqual(1);
    expect(snapshot.mode).toBe('profile');

    // Instance check
    const instance = createServiceC();
    expect(instance.telemetry).toBeDefined();
  });

  it('Service D automatically inherits telemetry', async () => {
    expect(ServiceDFacade.telemetry).toBeDefined();
    ServiceDFacade.telemetry.reset();
    ServiceDFacade.telemetry.enable('standard');

    const res = await ServiceDFacade.execute<{ message: string }, { echoed: string }>('echo', { message: 'hello' });
    expect(res.echoed).toBe('hello');

    const snapshot = ServiceDFacade.telemetry.snapshot();
    expect(snapshot.totals.invocationCount).toBeGreaterThanOrEqual(1);

    // Instance check
    const instance = createService(ServiceDDefinition);
    expect(instance.telemetry).toBeDefined();
    instance.telemetry.enable('detailed');
    await instance.start();
    const upper = await instance.call<{ text?: string }, { result: string }>('uppercase', { text: 'kloks' });
    expect(upper.result).toBe('KLOKS');
    expect(instance.telemetry.snapshot().totals.invocationCount).toBe(1);
  });

  it('FunctionsServiceFacade exposes operations through KrnlTS and inherits telemetry', async () => {
    expect(FunctionsServiceFacade.telemetry).toBeDefined();
    FunctionsServiceFacade.telemetry.reset();
    FunctionsServiceFacade.telemetry.enable('standard');

    const res = await FunctionsServiceFacade.execute<{ value: string }, string>('toKebabCase', { value: 'Hello World' });
    expect(res).toBe('hello-world');

    const snapshot = FunctionsServiceFacade.telemetry.snapshot();
    expect(snapshot.totals.invocationCount).toBeGreaterThanOrEqual(1);
    expect(snapshot.totals.successCount).toBeGreaterThanOrEqual(1);
  });

  it('Backend services automatically inherit telemetry', async () => {
    expect(AuthServiceFacade.telemetry).toBeDefined();
    expect((AuthServiceFacade as any).definition.operations.login).toBeDefined();
    expect((AuthServiceFacade as any).definition.operations.resolveUser).toBeDefined();

    expect(StorageServiceFacade.telemetry).toBeDefined();
    expect(WorkspaceServiceFacade.telemetry).toBeDefined();
    expect(ControlPlaneServiceFacade.telemetry).toBeDefined();

    const authInstance = AuthServiceFacade.createInstance();
    expect(authInstance.telemetry).toBeDefined();
  });
});
