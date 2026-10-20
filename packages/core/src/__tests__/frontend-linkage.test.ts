import { describe, expect, it } from 'vitest';
import { ServiceFacade } from '../services/ServiceFacade.js';
import type { OrchestrationDefinition } from '../orchestration/canonical/model.js';

describe('frontend linkage contracts', () => {
  it('retains a service default frontend reference without importing UI code', () => {
    const service = new ServiceFacade({
      id: 'node-graph.service',
      defaultFrontend: {
        component: 'FrnlEditableNodeGraph',
        package: '@ultrst-armada/floks/canvas-ui',
        relationship: 'recommended',
      },
    });

    expect(service.defaultFrontend).toEqual({
      component: 'FrnlEditableNodeGraph',
      package: '@ultrst-armada/floks/canvas-ui',
      relationship: 'recommended',
    });
  });

  it('accepts required and recommended orchestration frontend relationships', () => {
    const recommended: OrchestrationDefinition = {
      id: 'recommended.orchestration',
      name: 'Recommended',
      version: '1.0.0',
      scope: 'service',
      dependencies: [],
      defaultFrontend: { component: 'RecommendedPage', relationship: 'recommended' },
      steps: [],
    };
    const required: OrchestrationDefinition = {
      id: 'required.orchestration',
      name: 'Required',
      version: '1.0.0',
      scope: 'service',
      dependencies: [],
      defaultFrontend: { component: 'RequiredPage', relationship: 'required' },
      steps: [],
    };
    expect(recommended.defaultFrontend?.relationship).toBe('recommended');
    expect(required.defaultFrontend?.relationship).toBe('required');
  });

  it('allows service orchestration definitions to declare a default frontend reference', () => {
    const definition: OrchestrationDefinition = {
      id: 'workspace.orchestration',
      name: 'Workspace Orchestration',
      version: '1.0.0',
      scope: 'service',
      dependencies: ['workspace.service'],
      defaultFrontend: {
        component: 'WorkspaceTilesMenu',
        package: '@ultrst-armada/floks/ui',
        relationship: 'recommended',
      },
      steps: [],
    };

    expect(definition.defaultFrontend?.component).toBe('WorkspaceTilesMenu');
  });
});
