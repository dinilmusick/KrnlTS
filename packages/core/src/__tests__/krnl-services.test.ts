/**
 * @file krnl-services.test.ts
 * @description Suite testing canonical Test Services A-H and protocol compatibility.
 */

import { describe, it, expect } from 'vitest';
import {
  createTestServiceA,
  createTestServiceB,
  createTestServiceC,
} from './TestServices.fixtures.js';
import { HttpProtocolAdapter } from '../protocols/HttpProtocolAdapter.js';
import { WebSocketProtocolAdapter } from '../protocols/WebSocketProtocolAdapter.js';
import { UdpProtocolAdapter } from '../protocols/UdpProtocolAdapter.js';
import { P2PProtocolAdapter } from '../protocols/P2PProtocolAdapter.js';
import { createServiceProxy } from '../services/ServiceGenerators.js';

describe('KrnlTS Canonical Service Kernel (Services A-H)', () => {
  it('TEST SERVICE A: Pure local execution', async () => {
    const svcA = createTestServiceA();
    await svcA.start();
    const sum = await svcA.call('add', { a: 10, b: 20 });
    const product = await svcA.call('multiply', { a: 5, b: 6 });
    expect(sum).toBe(30);
    expect(product).toBe(30);
    await svcA.stop();
  });

  it('TEST SERVICE B: Stateful execution', async () => {
    const svcB = createTestServiceB();
    await svcB.start();
    expect(svcB.getState().count).toBe(0);
    svcB.setState({ count: 42 });
    expect(svcB.getState().count).toBe(42);
    await svcB.stop();
  });

  it('TEST SERVICE C: Functionality-owned event emission', async () => {
    const svcC = createTestServiceC();
    await svcC.start();
    const received: any[] = [];
    const unsub = svcC.namespace.functionalities.ping.events.reading.subscribe((payload) => {
      received.push(payload);
    });

    const result = await svcC.call('ping');
    svcC.namespace.functionalities.ping.emit('reading', { value: 100 });

    expect(result).toBe('pong');
    expect(received).toEqual([{ value: 100 }]);
    unsub.unsubscribe();
    await svcC.stop();
  });

  it('TEST SERVICE D: HTTP Protocol Exposure & Invocation', async () => {
    const svcA = createTestServiceA();
    await svcA.start();
    const adapter = new HttpProtocolAdapter();
    const endpoint = await adapter.expose(svcA, 0);

    const proxy = createServiceProxy(svcA.getDefinition(), adapter, endpoint);
    const sum = await proxy.call('add', { a: 15, b: 25 });
    expect(sum).toBe(40);

    await adapter.stop();
    await svcA.stop();
  });

  it('TEST SERVICE E: WebSocket Protocol Exposure & Invocation', async () => {
    const svcA = createTestServiceA();
    await svcA.start();
    const adapter = new WebSocketProtocolAdapter();
    const endpoint = await adapter.expose(svcA, 0);

    const proxy = createServiceProxy(svcA.getDefinition(), adapter, endpoint);
    const product = await proxy.call('multiply', { a: 7, b: 8 });
    expect(product).toBe(56);

    await adapter.stop();
    await svcA.stop();
  });

  it('TEST SERVICE F: UDP Datagram Exposure & Invocation', async () => {
    const svcA = createTestServiceA();
    await svcA.start();
    const adapter = new UdpProtocolAdapter();
    const endpoint = await adapter.expose(svcA, 0);

    const proxy = createServiceProxy(svcA.getDefinition(), adapter, endpoint);
    const sum = await proxy.call('add', { a: 100, b: 200 });
    expect(sum).toBe(300);

    await adapter.stop();
    await svcA.stop();
  });

  it('TEST SERVICE G: P2P Exposure & Invocation', async () => {
    const svcA = createTestServiceA();
    await svcA.start();
    const adapter = new P2PProtocolAdapter();
    const endpoint = await adapter.expose(svcA);

    const proxy = createServiceProxy(svcA.getDefinition(), adapter, endpoint);
    const product = await proxy.call('multiply', { a: 4, b: 25 });
    expect(product).toBe(100);

    await adapter.stop();
    await svcA.stop();
  });
});
