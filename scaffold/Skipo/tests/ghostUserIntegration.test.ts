import { describe, expect, it } from 'vitest';
import { floksFrnlFrontendApi, floksFrnlStore } from '@ultrst-armada/floks';
import { defineFrnlComponent, registerFrnlComponent } from '@ultrst-armada/frnlts';

describe('Ghost User Integration — AI Programmatic Frontend Automation', () => {
  it('inspects UI, locates target button, verifies rendered/mounted/available, invokes click, verifies state change', () => {
    // Canonical global API is automatically available on globalThis
    const api = (globalThis as { __FRNL_FRONTEND_API__?: typeof floksFrnlFrontendApi }).__FRNL_FRONTEND_API__ ?? floksFrnlFrontendApi;
    expect(api).toBeDefined();
    expect(api.inspect().apiVersion).toBe(1);

    const buttonDefinition = defineFrnlComponent({
      name: 'Button',
      states: {
        idle: {
          name: 'idle',
          events: { click: { functionId: 'button.create-service.click' } },
          visualParameters: { opacity: 1 },
          phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
        },
        submitting: {
          name: 'submitting',
          events: { click: { functionId: 'button.create-service.click' } },
          visualParameters: { opacity: 0.7 },
          phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
        },
      },
    });

    const entityId = 'create-service-action-button';

    // Component registers automatically into the canonical store
    floksFrnlStore.getState().registerEntity(entityId, {
      state: 'idle',
      properties: { label: 'Create Service', variant: 'primary', disabled: false },
    });
    registerFrnlComponent(floksFrnlStore, entityId, buttonDefinition);

    let actionExecuted = false;
    floksFrnlStore.getState().registerEventHandlers(entityId, {
      'button.create-service.click': () => {
        actionExecuted = true;
        floksFrnlStore.getState().setEntityState(entityId, 'submitting');
        return { success: true, serviceId: 'srv-42' };
      },
    });

    // 1. Ghost User inspects the frontend semantic snapshot without DOM selectors
    const initialSnapshot = api.inspect();
    expect(initialSnapshot.componentCount).toBeGreaterThanOrEqual(1);

    // 2. Ghost User finds button with label "Create Service"
    const target = initialSnapshot.components.find((comp) => comp.properties.label === 'Create Service');
    expect(target).toBeDefined();
    expect(target!.id).toBe(entityId);

    // 3. Verify component is rendered, mounted, and click control is available
    expect(target!.rendered).toBe(true);
    expect(target!.lifecycle.mounted).toBe(true);
    expect(target!.state).toBe('idle');
    expect(target!.controls.click).toBeDefined();
    expect(target!.controls.click.available).toBe(true);

    // 4. Ghost User invokes the semantic control
    const invocationResult = api.component(target!.id).invoke('click');
    expect(actionExecuted).toBe(true);
    expect(invocationResult).toEqual({ success: true, serviceId: 'srv-42' });

    // 5. Ghost User inspects again and verifies state transition
    const postSnapshot = api.inspect();
    const updated = postSnapshot.components.find((comp) => comp.id === entityId);
    expect(updated).toBeDefined();
    expect(updated!.state).toBe('submitting');

    // 6. Ghost User tests direct visual parameter override and theme application
    api.component(entityId).invoke('setVisualParameter', { parameter: 'opacity', value: 0.85 });
    expect(floksFrnlStore.getState().visualOverrides[entityId]?.opacity).toBe(0.85);

    // Clean up
    floksFrnlStore.getState().unregisterEntity(entityId);
    expect(api.inspect().components.some((comp) => comp.id === entityId)).toBe(false);
  });
});
