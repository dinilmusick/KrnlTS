import { describe, expect, it, vi } from 'vitest';
import {
  createLifecycle,
  defineContract,
  defineCommand,
  defineCapability,
  defineEffect,
  LifecycleError,
  FrnlFault,
} from '../src/runtime/core.js';
import {
  createScope,
  defineResource,
  createResourceController,
} from '../src/runtime/resources.js';
import { FrnlRegistry } from '../src/runtime/registry.js';
import { DependencyGraph } from '../src/runtime/dependencies.js';
import { matchRoute, buildRouteUrl, FrnlRouter } from '../src/runtime/routing.js';
import { validateAccessibility } from '../src/runtime/accessibility.js';
import { createFrnlStore } from '../src/runtime/store.js';
import * as RootExports from '../src/index.js';
import * as RuntimeExports from '../src/runtime/index.js';
import * as ReactExports from '../src/react/index.js';

describe('FrnlTS Frontend Runtime Suite', () => {
  describe('1. Lifecycle Controller', () => {
    it('enforces full forward lifecycle transitions', () => {
      const lc = createLifecycle();
      expect(lc.phase).toBe('created');

      lc.transition('initializing');
      expect(lc.phase).toBe('initializing');

      lc.transition('mounted');
      expect(lc.phase).toBe('mounted');

      lc.transition('active');
      expect(lc.phase).toBe('active');

      lc.transition('suspended');
      expect(lc.phase).toBe('suspended');

      lc.transition('resuming');
      expect(lc.phase).toBe('resuming');

      lc.transition('active');
      expect(lc.phase).toBe('active');

      lc.transition('disposing');
      expect(lc.phase).toBe('disposing');

      lc.transition('disposed');
      expect(lc.phase).toBe('disposed');
    });

    it('rejects invalid or impossible transitions with LifecycleError', () => {
      const lc = createLifecycle();
      expect(() => lc.transition('active')).toThrow(LifecycleError);
      expect(() => lc.transition('mounted')).toThrow(LifecycleError);

      lc.transition('initializing');
      expect(() => lc.transition('created')).toThrow(LifecycleError);

      lc.transition('mounted');
      lc.transition('active');
      expect(() => lc.transition('created')).toThrow(LifecycleError);
      expect(() => lc.transition('initializing')).toThrow(LifecycleError);

      lc.transition('disposing');
      lc.transition('disposed');
      // No transitions allowed out of disposed
      expect(() => lc.transition('created')).toThrow(LifecycleError);
      expect(() => lc.transition('active')).toThrow(LifecycleError);
    });

    it('handles idempotent transitions to current phase without error or duplicate events', () => {
      const lc = createLifecycle('initializing');
      const listener = vi.fn();
      lc.subscribe(listener);

      lc.transition('initializing');
      expect(listener).not.toHaveBeenCalled();
      expect(lc.phase).toBe('initializing');
    });

    it('notifies subscribers on valid transitions and supports unsubscribing', () => {
      const lc = createLifecycle();
      const events: Array<{ from: string; to: string }> = [];
      const unsub = lc.subscribe((t) => events.push(t));

      lc.transition('initializing');
      lc.transition('mounted');
      expect(events).toEqual([
        { from: 'created', to: 'initializing' },
        { from: 'initializing', to: 'mounted' },
      ]);

      unsub();
      lc.transition('active');
      expect(events).toHaveLength(2);
    });

    it('handles recovery from failed state back to initializing or to disposed', () => {
      const lc = createLifecycle('initializing');
      lc.transition('failed');
      expect(lc.phase).toBe('failed');

      lc.transition('initializing');
      expect(lc.phase).toBe('initializing');

      lc.transition('failed');
      lc.transition('disposed');
      expect(lc.phase).toBe('disposed');
    });
  });

  describe('2. Contracts, Commands, Capabilities and Effects', () => {
    it('validates and freezes semantic contracts', () => {
      const contract = defineContract({
        id: 'button-action',
        version: 1,
        commands: ['trigger', 'reset'],
        events: ['clicked'],
        capabilities: ['dom-focus'],
      });
      expect(contract.id).toBe('button-action');
      expect(contract.version).toBe(1);
      expect(Object.isFrozen(contract)).toBe(true);

      expect(() =>
        defineContract({
          id: 'bad',
          version: -1,
        } as any)
      ).toThrow();
    });

    it('validates and defines commands', () => {
      const cmd = defineCommand('mutate-state', { counter: 42 });
      expect(cmd.id).toBe('mutate-state');
      expect(cmd.payload).toEqual({ counter: 42 });
      expect(Object.isFrozen(cmd)).toBe(true);

      expect(() => defineCommand('')).toThrow();
    });

    it('validates and defines capabilities', () => {
      const cap = defineCapability({
        id: 'canvas-renderer',
        version: 2,
        provides: ['2d-context', 'webgl'],
        requires: ['window'],
      });
      expect(cap.id).toBe('canvas-renderer');
      expect(cap.version).toBe(2);
      expect(Object.isFrozen(cap)).toBe(true);
    });

    it('defines effects and executes with AbortSignal', async () => {
      const effect = defineEffect('fetch-data', async (signal) => {
        if (signal.aborted) throw new Error('aborted');
        return 'success';
      });

      const controller = new AbortController();
      await expect(effect.run(controller.signal)).resolves.toBe('success');

      controller.abort();
      await expect(effect.run(controller.signal)).rejects.toThrow('aborted');
    });

    it('preserves structured causes and properties in FrnlFault', () => {
      const originalErr = new Error('Database connection failed');
      const fault = new FrnlFault({
        code: 'STORAGE_UNAVAILABLE',
        message: 'Could not connect to storage backend',
        recoverable: true,
        retryable: true,
        cause: originalErr,
      });

      expect(fault.name).toBe('FrnlFault');
      expect(fault.code).toBe('STORAGE_UNAVAILABLE');
      expect(fault.recoverable).toBe(true);
      expect(fault.retryable).toBe(true);
      expect(fault.cause).toBe(originalErr);
    });
  });

  describe('3. Scoped Resources, Race Conditions and Lifecycle Invariants', () => {
    it('acquires resource and caches value idempotently', async () => {
      let acquireCount = 0;
      const res = defineResource({
        id: 'api-client',
        acquire: async () => {
          acquireCount++;
          return { connected: true };
        },
      });

      const scope = createScope('test-scope');
      const ctrl = scope.add(res);

      expect(ctrl.status).toBe('idle');
      const val1 = await ctrl.load();
      expect(ctrl.status).toBe('ready');
      expect(val1).toEqual({ connected: true });
      expect(acquireCount).toBe(1);

      // Subsequent loads return cached value without invoking acquire again
      const val2 = await ctrl.load();
      expect(val2).toBe(val1);
      expect(acquireCount).toBe(1);

      await scope.dispose();
      expect(ctrl.status).toBe('released');
    });

    it('deduplicates concurrent in-flight load requests', async () => {
      let acquireCalls = 0;
      const res = defineResource({
        id: 'concurrent-res',
        acquire: async () => {
          acquireCalls++;
          await new Promise((r) => setTimeout(r, 20));
          return 'done';
        },
      });

      const scope = createScope('concurrent-scope');
      const ctrl = scope.add(res);

      const [r1, r2, r3] = await Promise.all([ctrl.load(), ctrl.load(), ctrl.load()]);
      expect(r1).toBe('done');
      expect(r2).toBe('done');
      expect(r3).toBe('done');
      expect(acquireCalls).toBe(1);

      await scope.dispose();
    });

    it('race condition: handles resource acquisition finishing after release was requested', async () => {
      let releaseCalled = false;
      const slowRes = defineResource({
        id: 'slow-async-res',
        acquire: async () => {
          await new Promise((r) => setTimeout(r, 40));
          return 'late-value';
        },
        release: (val) => {
          if (val === 'late-value') {
            releaseCalled = true;
          }
        },
      });

      const ctrl = createResourceController(slowRes, 'race-scope');
      const loadPromise = ctrl.load();

      // Release mid-flight before acquire completes
      await ctrl.release();

      await expect(loadPromise).rejects.toThrow();
      expect(ctrl.status).toBe('released');
      expect(releaseCalled).toBe(true);
    });

    it('race condition: handles failed acquisition followed by successful retry', async () => {
      let attempts = 0;
      const retryableRes = defineResource({
        id: 'flakey-res',
        acquire: async () => {
          attempts++;
          if (attempts === 1) {
            throw new Error('Temporary network glitch');
          }
          return 'recovered-data';
        },
      });

      const ctrl = createResourceController(retryableRes, 'retry-scope');

      // Attempt 1 fails
      await expect(ctrl.load()).rejects.toThrow('Temporary network glitch');
      expect(ctrl.status).toBe('error');
      expect(ctrl.error?.code).toBe('RESOURCE_ACQUIRE_FAILED');

      // Attempt 2 (retry) succeeds
      const result = await ctrl.load();
      expect(result).toBe('recovered-data');
      expect(ctrl.status).toBe('ready');
      expect(ctrl.error).toBeUndefined();
    });

    it('race condition: handles release failure cleanly and preserves cause', async () => {
      const releaseError = new Error('Failed to cleanly close socket');
      const failingRes = defineResource({
        id: 'failing-release-res',
        acquire: () => ({ socketId: 101 }),
        release: () => {
          throw releaseError;
        },
      });

      const ctrl = createResourceController(failingRes, 'fail-release-scope');
      await ctrl.load();

      await expect(ctrl.release()).rejects.toThrow(FrnlFault);
      expect(ctrl.status).toBe('released');
      expect(ctrl.error?.code).toBe('RESOURCE_RELEASE_FAILED');
      expect(ctrl.error?.cause).toBe(releaseError);

      // Calling release again does not duplicate the throw
      await expect(ctrl.release()).resolves.toBeUndefined();
    });

    it('race condition: repeated concurrent release calls resolve identically', async () => {
      let releaseCount = 0;
      const res = defineResource({
        id: 'double-release-res',
        acquire: () => 123,
        release: async () => {
          releaseCount++;
          await new Promise((r) => setTimeout(r, 20));
        },
      });

      const ctrl = createResourceController(res, 'multi-release-scope');
      await ctrl.load();

      await Promise.all([ctrl.release(), ctrl.release(), ctrl.release()]);
      expect(releaseCount).toBe(1);
      expect(ctrl.status).toBe('released');
    });

    it('parent and child scopes: cascading disposal and zero memory leaks', async () => {
      const releasedIds: string[] = [];

      const parentScope = createScope('root-parent');
      const child1 = parentScope.createChildScope('child-1');
      const child2 = child1.createChildScope('child-2');

      const resRoot = parentScope.add(
        defineResource({
          id: 'res-root',
          acquire: () => 'val-root',
          release: () => {
            releasedIds.push('res-root');
          },
        })
      );

      const resChild1 = child1.add(
        defineResource({
          id: 'res-child1',
          acquire: () => 'val-child1',
          release: () => {
            releasedIds.push('res-child1');
          },
        })
      );

      const resChild2 = child2.add(
        defineResource({
          id: 'res-child2',
          acquire: () => 'val-child2',
          release: () => {
            releasedIds.push('res-child2');
          },
        })
      );

      await Promise.all([resRoot.load(), resChild1.load(), resChild2.load()]);

      // Early disposal of child2 should clean up child2 without disposing child1 or parent
      await child2.dispose();
      expect(resChild2.status).toBe('released');
      expect(resChild1.status).toBe('ready');
      expect(resRoot.status).toBe('ready');
      expect(releasedIds).toEqual(['res-child2']);

      // Disposing parentScope cascades through all remaining descendants
      await parentScope.dispose();
      expect(resChild1.status).toBe('released');
      expect(resRoot.status).toBe('released');
      expect(releasedIds).toContain('res-root');
      expect(releasedIds).toContain('res-child1');

      // Attempting to create child or add resource to disposed scope throws FrnlFault
      expect(() => parentScope.createChildScope('new-child')).toThrow(FrnlFault);
      expect(() =>
        parentScope.add(
          defineResource({
            id: 'late',
            acquire: () => 1,
          })
        )
      ).toThrow(FrnlFault);
    });
  });

  describe('4. Registry, Capability Resolution & Composable Dependency Graph', () => {
    it('registers entries, supports version upgrade, and blocks version downgrade', () => {
      const reg = new FrnlRegistry();
      reg.register({
        id: 'theme-service',
        version: 1,
        value: { theme: 'light' },
      });

      expect(reg.has('theme-service')).toBe(true);
      expect(reg.resolve('theme-service')).toEqual({ theme: 'light' });

      // Upgrade to version 2
      reg.register({
        id: 'theme-service',
        version: 2,
        value: { theme: 'dark' },
      });
      expect(reg.resolve('theme-service')).toEqual({ theme: 'dark' });

      // Downgrade to version 1 throws error
      expect(() =>
        reg.register({
          id: 'theme-service',
          version: 1,
          value: { theme: 'old' },
        })
      ).toThrow(/older version/i);
    });

    it('enforces required capabilities from contract and capability schemas', () => {
      const reg = new FrnlRegistry();
      reg.register({
        id: 'editor-service',
        version: 1,
        contract: {
          id: 'editor-contract',
          version: 1,
          capabilities: ['syntax-highlighting', 'undo-history'],
        },
        value: { init: () => {} },
      });

      expect(() => reg.requireCapabilities('editor-service', ['syntax-highlighting'])).toThrow(
        /Missing capability 'undo-history'/
      );

      expect(() =>
        reg.requireCapabilities('editor-service', [
          'syntax-highlighting',
          'undo-history',
          'extra-cap',
        ])
      ).not.toThrow();
    });

    it('bridges registry to DependencyGraph and validates dependencies', () => {
      const reg = new FrnlRegistry();
      reg.register({
        id: 'storage-service',
        version: 1,
        capabilities: [
          defineCapability({
            id: 'kv-store',
            version: 1,
            provides: ['key-value'],
          }),
        ],
        value: {},
      });

      reg.register({
        id: 'user-profile-service',
        version: 1,
        contract: defineContract({
          id: 'user-contract',
          version: 1,
          capabilities: ['key-value'],
        }),
        value: {},
      });

      const graph = reg.toDependencyGraph();
      const validationErrors = graph.validate();
      expect(validationErrors).toEqual([]);

      const order = graph.topologicalOrder();
      expect(order.indexOf('storage-service')).toBeLessThan(order.indexOf('user-profile-service'));
    });

    it('detects missing dependencies and cyclic dependencies in DependencyGraph', () => {
      const graph = new DependencyGraph();
      graph.register({ id: 'page', requires: ['auth-service'] });

      const errors = graph.validate();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('page requires missing dependency auth-service');

      // Cycle detection
      const cyclicGraph = new DependencyGraph();
      cyclicGraph.register({ id: 'a', requires: ['b'] });
      cyclicGraph.register({ id: 'b', requires: ['c'] });
      cyclicGraph.register({ id: 'c', requires: ['a'] });

      expect(() => cyclicGraph.topologicalOrder()).toThrow(/cycle detected/i);
    });
  });

  describe('5. Routing Hardening', () => {
    it('escapes regex characters in static path segments', () => {
      const route = { id: 'special', pattern: '/api/v1.0/doc(overview)' };
      const match = matchRoute(route, '/api/v1.0/doc(overview)');
      expect(match).not.toBeNull();
      expect(match?.id).toBe('special');

      const nonMatch = matchRoute(route, '/api/v1x0/doc(overview)');
      expect(nonMatch).toBeNull();
    });

    it('matches wildcard and named wildcards correctly', () => {
      const route1 = { id: 'catchall', pattern: '/assets/*' };
      const match1 = matchRoute(route1, '/assets/images/icons/logo.png');
      expect(match1?.params.wildcard).toBe('images/icons/logo.png');

      const route2 = { id: 'named-wildcard', pattern: '/docs/*filepath' };
      const match2 = matchRoute(route2, '/docs/guide/start.md');
      expect(match2?.params.filepath).toBe('guide/start.md');
    });

    it('builds route URLs and validates missing parameters', () => {
      const route = { id: 'user-view', pattern: '/users/:userId/orders/:orderId' };

      expect(() => buildRouteUrl(route, { userId: 'u1' })).toThrow(
        /Missing route parameter: orderId/
      );

      const url = buildRouteUrl(
        route,
        { userId: 'alice', orderId: 'ord-99' },
        { sort: 'desc' }
      );
      expect(url).toBe('/users/alice/orders/ord-99?sort=desc');

      const matched = matchRoute(route, url);
      expect(matched?.params).toEqual({ userId: 'alice', orderId: 'ord-99' });
      expect(matched?.query).toEqual({ sort: 'desc' });
    });

    it('handles strict and appendUnmatchedParamsToQuery options in buildRouteUrl', () => {
      const route = { id: 'simple', pattern: '/items/:id' };

      expect(() =>
        buildRouteUrl(route, { id: '10', unusedParam: 'foo' }, {}, { strict: true })
      ).toThrow(/Unknown route parameter: unusedParam/);

      const url = buildRouteUrl(
        route,
        { id: '10', extra: 'bar' },
        {},
        { appendUnmatchedParamsToQuery: true }
      );
      expect(url).toBe('/items/10?extra=bar');
    });

    it('prevents duplicate route IDs and duplicate route patterns in FrnlRouter', () => {
      const router = new FrnlRouter();
      router.addRoute({ id: 'r1', pattern: '/dashboard' });

      // Duplicate ID
      expect(() => router.addRoute({ id: 'r1', pattern: '/other' })).toThrow(
        /Duplicate route id: r1/
      );

      // Conflicting pattern
      expect(() => router.addRoute({ id: 'r2', pattern: '/dashboard' })).toThrow(
        /Conflicting route pattern/
      );
    });

    it('resolves routes lazily with load() in FrnlRouter', async () => {
      const router = new FrnlRouter([
        {
          id: 'lazy-data',
          pattern: '/data/:id',
          load: async () => ({ loaded: true, timestamp: 123456 }),
        },
      ]);

      const resolution = await router.resolve('/data/42');
      expect(resolution).not.toBeNull();
      expect(resolution?.match.params.id).toBe('42');
      expect(resolution?.data).toEqual({ loaded: true, timestamp: 123456 });

      const missing = await router.resolve('/not-found');
      expect(missing).toBeNull();
    });
  });

  describe('6. Accessibility Validation', () => {
    it('detects missing accessible names for controls requiring them', () => {
      const issues = validateAccessibility(
        { role: 'button', nameRequired: true },
        { role: 'button' }
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].code).toBe('ACCESSIBLE_NAME_REQUIRED');

      const validAriaLabel = validateAccessibility(
        { role: 'button', nameRequired: true },
        { role: 'button', 'aria-label': 'Close dialog' }
      );
      expect(validAriaLabel).toEqual([]);

      const validAriaLabelledBy = validateAccessibility(
        { role: 'button', nameRequired: true },
        { role: 'button', 'aria-labelledby': 'heading-id' }
      );
      expect(validAriaLabelledBy).toEqual([]);
    });

    it('detects missing required attributes and role mismatches', () => {
      const issues = validateAccessibility(
        {
          role: 'checkbox',
          requiredAttributes: ['aria-checked'],
        },
        { role: 'button' }
      );

      expect(issues.some((i) => i.code === 'ROLE_MISMATCH')).toBe(true);
      expect(issues.some((i) => i.code === 'REQUIRED_ATTRIBUTE_MISSING')).toBe(true);
    });
  });

  describe('7. Semantic Store & Reactive State Invariants', () => {
    it('registers entities and manages state propagation without layout metadata', () => {
      const store = createFrnlStore();

      store.getState().registerEntity('btn-primary', {
        state: 'idle',
        properties: { label: 'Submit' },
      });

      expect(store.getState().entities['btn-primary'].properties.label).toBe('Submit');
      expect('bounds' in store.getState().entities['btn-primary']).toBe(false);
      expect('slots' in store.getState()).toBe(false);
      expect('slotCollections' in store.getState()).toBe(false);

      store.getState().setEntityProperty('btn-primary', 'label', 'Saving...');
      expect(store.getState().entities['btn-primary'].properties.label).toBe('Saving...');

      store.getState().setEntityState('btn-primary', 'hovered');
      expect(store.getState().entities['btn-primary'].state).toBe('hovered');
      expect(store.getState().events.some((e) => e.type === 'entity.stateChanged')).toBe(true);
    });
  });

  describe('8. Architecture & Public Package Exports Purity', () => {
    it('exports all runtime primitives from root and runtime subpaths', () => {
      expect(RootExports.createLifecycle).toBeDefined();
      expect(RootExports.createScope).toBeDefined();
      expect(RootExports.FrnlRegistry).toBeDefined();
      expect(RootExports.FrnlRouter).toBeDefined();
      expect(RootExports.createFrnlStore).toBeDefined();
      expect(RootExports.registerFrnlTheme).toBeDefined();
      expect(RootExports.applyFrnlTheme).toBeDefined();
      expect(RootExports.resolveFrnlVisualParameters).toBeDefined();
      expect(RootExports.getFrnlComponentTheme).toBeDefined();
      expect(RootExports.FrnlFacade).toBeDefined();
      expect(RootExports.createFrnlFacade).toBeDefined();
      expect(RootExports.frnlThemeDefinitionSchema).toBeDefined();

      expect(RuntimeExports.createLifecycle).toBeDefined();
      expect(RuntimeExports.createScope).toBeDefined();
      expect(RuntimeExports.FrnlRegistry).toBeDefined();
      expect(RuntimeExports.FrnlRouter).toBeDefined();
      expect(RuntimeExports.createFrnlStore).toBeDefined();
      expect(RuntimeExports.registerFrnlTheme).toBeDefined();
      expect(RuntimeExports.applyFrnlTheme).toBeDefined();
      expect(RuntimeExports.resolveFrnlVisualParameters).toBeDefined();
      expect(RuntimeExports.getFrnlComponentTheme).toBeDefined();
      expect(RuntimeExports.FrnlFacade).toBeDefined();
      expect(RuntimeExports.createFrnlFacade).toBeDefined();
      expect(RuntimeExports.frnlThemeDefinitionSchema).toBeDefined();
    });

    it('keeps React adapter separate with zero React pollution in core runtime', () => {
      expect(ReactExports.useFrnlComponent).toBeDefined();
      expect('FrnlSlot' in ReactExports).toBe(false);

      expect(RuntimeExports.defineFrnlComponent).toBeDefined();
      expect(RootExports.defineFrnlComponent).toBeDefined();
    });
  });
});