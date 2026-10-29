/**
 * @file TestServices.fixtures.ts
 * @description Canonical Test Services A-H fixtures for KrnlTS.
 */

import { createService, createServiceDefinition } from '../services/ServiceGenerators.js';
import type { IService } from '../services/ServiceContract.js';
import { ServiceFacade } from '../services/ServiceFacade.js';

// TEST SERVICE A: Pure local stateless service
export function createTestServiceA(): IService {
  return createService(createServiceDefinition({
    id: 'test-svc-a',
    name: 'MathService',
    version: '1.0.0',
    operations: {
      add: {
        id: 'math.add',
        name: 'add',
        handler: async (input: any) => input.a + input.b,
      },
      multiply: {
        id: 'math.multiply',
        name: 'multiply',
        handler: async (input: any) => input.a * input.b,
      },
    },
  }));
}

// TEST SERVICE B: Stateful service
export function createTestServiceB(): IService<{ count: number }> {
  return createService<{ count: number }>(createServiceDefinition({
    id: 'test-svc-b',
    name: 'CounterService',
    version: '1.0.0',
    state: {
      initial: { count: 0 },
    },
    operations: {
      increment: {
        id: 'counter.increment',
        name: 'increment',
        handler: async (_input: any, ctx: any) => {
          // Handled via service state mutation in consumer
          return true;
        },
      },
      getCount: {
        id: 'counter.getCount',
        name: 'getCount',
        handler: async (_input: any) => 0,
      },
    },
  }));
}

// TEST SERVICE C: Functionality event service facade
export function createTestServiceC(): ServiceFacade {
  return new ServiceFacade({
    id: 'test-svc-c',
    name: 'SensorService',
    version: '1.0.0',
    functionalities: {
      ping: {
        events: {
          reading: {
            name: 'reading',
            description: 'Sensor data stream',
          },
        },
        execute: async () => 'pong',
      },
    },
  });
}
