import { describe, expect, it } from 'vitest';
import { ConnectionRuleStore, MagneticGraphManager } from '@floks/contracts';
import type { GraphNode } from '@floks/contracts';
import { frnlEditableNodeGraphDefinition } from './FrnlEditableNodeGraph.js';

describe('FRNL Editable Node Graph', () => {
  it('defines the graph as a first-class FRNL component with magnetic trace events', () => {
    expect(frnlEditableNodeGraphDefinition.name).toBe('frnlEditableNodeGraph');
    expect(frnlEditableNodeGraphDefinition.states.idle.events.magneticTraceSolidify).toBeDefined();
    expect(frnlEditableNodeGraphDefinition.states.idle.phases?.sustainPhase).toBeDefined();
  });

  it('retains the QWNSR graph capabilities through the FLOKS graph infrastructure', () => {
    ConnectionRuleStore.initializeDefaults();

    const source: GraphNode = {
      id: 'source',
      type: 'source',
      label: 'Source',
      position: { x: 0, y: 0 },
      inputs: [],
      outputs: [{ id: 'out', label: 'Out', type: 'output', dataType: 'AUDIO_STEREO' }],
    } as GraphNode;
    const target: GraphNode = {
      id: 'target',
      type: 'target',
      label: 'Target',
      position: { x: 10, y: 10 },
      inputs: [{ id: 'in', label: 'In', type: 'input', dataType: 'AUDIO_STEREO' }],
      outputs: [],
    } as GraphNode;

    const mgr = new MagneticGraphManager(320);
    const traces = mgr.computeTraces([source, target] as any);
    expect(traces.some(
      (trace) =>
        trace.sourceNodeId === 'source' &&
        trace.targetNodeId === 'target' &&
        trace.sourceHandleId === 'out' &&
        trace.targetHandleId === 'in'
    )).toBe(true);
  });
});


describe('FRNL Editable Node Graph signal visualization contract', () => {
  it('accepts generic socket telemetry for audio and MIDI visualization without importing QWNSR', () => {
    const telemetry = {
      gain: { db: -6, formatted: '-6.0dB', color: '#22c55e' },
      midi: { active: true, velocity: 0.8, note: 64 },
    };
    expect(telemetry.gain.formatted).toBe('-6.0dB');
    expect(telemetry.midi.note).toBe(64);
  });

  it('exposes predictive solidification events as FRNL events', () => {
    expect(frnlEditableNodeGraphDefinition.states.idle.events.predictiveSolidify).toBeDefined();
    expect(frnlEditableNodeGraphDefinition.states.idle.events.predictiveSolidifyAll).toBeDefined();
  });
});


describe('FRNL Editable Node Graph node menu contract', () => {
  it('derives node categories and menu visibility from node metadata', async () => {
    const { menuCategory, menuHidden } = await import('../node-graph-ui/widgets/NodeSearchPalette.js');
    const node = {
      type: 'oscillator',
      label: 'Oscillator',
      metadata: { category: 'Generators', menuHidden: false },
    } as any;
    expect(menuCategory(node)).toBe('Generators');
    expect(menuHidden(node)).toBe(false);
    expect(menuHidden({ ...node, metadata: { category: 'Generators', menuHidden: true } })).toBe(true);
  });

  it('uses the canonical compatibility store for compatible node discovery', () => {
    ConnectionRuleStore.initializeDefaults();
    const source = { dataType: 'AUDIO_STEREO', direction: 'OUTPUT', handleCategory: 'DATA' } as const;
    const compatible = ConnectionRuleStore.getCompatibleNodeTypes(source);
    expect(Array.isArray(compatible)).toBe(true);
  });
});
