import { describe, expect, it } from 'vitest';
import { frnlNodeGraphDefinition } from './frnlNodeGraph.js';
import { frnlForceGraphDefinition } from './frnlForceGraph.js';

describe('canonical Floks FRNL graph entities', () => {
  it('defines the editable node graph as a FRNL component', () => {
    expect(frnlNodeGraphDefinition.name).toBe('frnlNodeGraph');
    expect(frnlNodeGraphDefinition.states.idle.events.connect.functionId).toBe('frnlNodeGraph.idle.connect');
    expect(frnlNodeGraphDefinition.states.idle.phases.sustainPhase).toBeDefined();
  });

  it('defines the force graph separately from the editable graph', () => {
    expect(frnlForceGraphDefinition.name).toBe('frnlForceGraph');
    expect(frnlForceGraphDefinition.states.idle.events.nodeClick.functionId).toBe('frnlForceGraph.idle.nodeClick');
  });
});
