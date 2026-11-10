import { describe, expect, it, vi } from 'vitest';
import {
  LifecycleManager,
  createService,
  createServiceDefinition,
  createServiceProxy,
  ServiceRegistry,
  ServiceRuntime,
  ServiceProxy,
} from '../index.js';

function definition(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test.service',
    name: 'Test Service',
    version: '1.0.0',
    operations: {
      ping: {
        id: 'ping',
        name: 'ping',
        handler: async () => 'pong',
      },
    },
    ...overrides,
  };
}

describe('ServiceRegistry duplicate registration semantics', () => {
    it('refuses duplicate registration with same ID and same version on register()', () => {
      const registry = new ServiceRegistry();
      const def1 = definition({ version: '1.0.0', name: 'Initial Name' });
      registry.register(def1);

      const def1Duplicate = definition({ version: '1.0.0', name: 'Duplicate Name' });
      expect(() => registry.register(def1Duplicate)).toThrow(
        "[ServiceRegistry] Service 'test.service' is already registered at version '1.0.0'. Use replace() to explicitly replace an existing service."
      );
    });

    it('refuses re-registration with same ID and different version deterministically', () => {
      const registry = new ServiceRegistry();
      const def1 = definition({ version: '1.0.0' });
      registry.register(def1);

      const def2 = definition({ version: '2.0.0' });
      expect(() => registry.register(def2)).toThrow(
        "[ServiceRegistry] Service 'test.service' is already registered at version '1.0.0'. Use replace() to explicitly replace an existing service."
      );

      // Verify original remains intact
      expect(registry.get('test.service')!.definition.version).toBe('1.0.0');
    });

    it('allows explicit replacement via replace(), updating definition/endpoints and preserving registeredAt', async () => {
      const registry = new ServiceRegistry();
      const def1 = definition({ version: '1.0.0', name: 'Initial Name' });
      registry.register(def1, [{ protocol: 'http', address: '127.0.0.1', port: 3000, capabilities: ['query'] }]);

      const record1 = registry.get('test.service');
      expect(record1).toBeDefined();
      expect(record1!.definition.name).toBe('Initial Name');
      expect(record1!.endpoints).toHaveLength(1);
      const initialTimestamp = record1!.registeredAt;

      // Small delay to verify timestamp preservation
      await new Promise((r) => setTimeout(r, 10));

      const defUpdated = definition({ version: '2.0.0', name: 'Updated Name' });
      registry.replace(defUpdated, [
        { protocol: 'http', address: '127.0.0.1', port: 3000, capabilities: ['query'] },
        { protocol: 'ws', address: '127.0.0.1', port: 3001, capabilities: ['stream'] },
      ]);

      const record2 = registry.get('test.service');
      expect(record2!.definition.name).toBe('Updated Name');
      expect(record2!.definition.version).toBe('2.0.0');
      expect(record2!.endpoints).toHaveLength(2);
      expect(record2!.registeredAt).toBe(initialTimestamp); // Preserved!
    });

    it('allows new version registration after explicit unregister', () => {
      const registry = new ServiceRegistry();
      registry.register(definition({ version: '1.0.0' }));
      expect(registry.unregister('test.service')).toBe(true);
      expect(registry.get('test.service')).toBeUndefined();

      registry.register(definition({ version: '2.0.0' }));
      expect(registry.get('test.service')!.definition.version).toBe('2.0.0');
    });
  });
