import { describe, expect, it } from 'vitest';
import { floksFrnlFrontendApi, floksFrnlStore } from '../packages/ui/src/frnl/store.js';

describe('Floks AI-native frontend API', () => {
  it('installs one canonical programmatic API for the shared Frnl store', () => {
    expect(floksFrnlFrontendApi.inspect().apiVersion).toBe(1);
    expect((globalThis as { __FRNL_FRONTEND_API__?: unknown }).__FRNL_FRONTEND_API__).toBe(floksFrnlFrontendApi);
  });

  it('observes the shared store without application-authored API glue', () => {
    floksFrnlStore.getState().registerEntity('api-test', {
      state: 'idle',
      properties: { label: 'API Test' },
    });
    const snapshot = floksFrnlFrontendApi.inspect();
    expect(snapshot.components.some((component) => component.id === 'api-test')).toBe(true);
    
    // AI programmatic control invocation without DOM hacks
    const handle = floksFrnlFrontendApi.component('api-test');
    expect(handle).toBeDefined();
    handle.invoke('setState', 'active');
    expect(floksFrnlStore.getState().entities['api-test']?.state).toBe('active');

    handle.invoke('setVisualParameter', { parameter: 'customVar', value: 'accent-1' });
    expect(floksFrnlStore.getState().visualOverrides['api-test']?.customVar).toBe('accent-1');

    floksFrnlStore.getState().unregisterEntity('api-test');
    expect(floksFrnlFrontendApi.inspect().components.some((component) => component.id === 'api-test')).toBe(false);
    expect(() => floksFrnlFrontendApi.inspectComponent('api-test')).toThrow('Unknown Frnl component: api-test');
  });
});
