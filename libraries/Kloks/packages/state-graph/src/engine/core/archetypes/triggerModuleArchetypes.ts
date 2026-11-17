import { NodeArchetypeDefinition } from "./types";
import { createTriggerNode, createModuleNode, createControlNode } from "../../functions/nodeFactory";

export const TRIGGER_MODULE_CORE_ARCHETYPES: NodeArchetypeDefinition[] = [
  {
    id: 'trigger_beats',
      category: 'Triggers',
      label: 'Beats Sequencer',
      defaultDescription: '1-bar step sequencer emitting quantized beat trigger pulses',
      iconName: 'zap',
      spawnType: { kind: 'trigger', triggerType: 'beats' },
      createPrototype: () => {
        const trig = createTriggerNode(1, undefined, 'beats');
        return trig;
      },
    },
    {
      id: 'trigger_beat_fractions',
      category: 'Triggers',
      label: 'Beat Fractions Sequencer',
      defaultDescription: 'Subdivided rhythmic fraction step sequencer emitting sub-beat pulses',
      iconName: 'clock',
      spawnType: { kind: 'trigger', triggerType: 'beat_fractions' },
      createPrototype: () => {
        const trig = createTriggerNode(1, undefined, 'beat_fractions');
        return trig;
      },
    },
    {
      id: 'trigger_euclidean',
      category: 'Triggers',
      label: 'Euclidean Rhythm Generator',
      defaultDescription: 'Generates algorithmic Euclidean polyrhythmic pulse triggers',
      iconName: 'clock',
      spawnType: { kind: 'trigger', triggerType: 'euclidean' },
      createPrototype: () => {
        const trig = createTriggerNode(1);
        trig.triggerType = 'euclidean';
        return trig;
      },
    },
    {
      id: 'trigger_random',
      category: 'Triggers',
      label: 'Stochastic / Random Trigger',
      defaultDescription: 'Probability-weighted stochastic pulse trigger generator',
      iconName: 'zap',
      spawnType: { kind: 'trigger', triggerType: 'random' },
      createPrototype: () => {
        const trig = createTriggerNode(1);
        trig.triggerType = 'random';
        return trig;
      },
    },

    // ── 8. SUB-GRAPH MODULES ───────────────────────────────────────────────────
    {
      id: 'module_flow',
      category: 'Modules',
      label: 'Sub-Graph Flow Module',
      defaultDescription: 'Modular encapsulated sub-graph container with customizable I/O ports',
      iconName: 'layers',
      spawnType: { kind: 'module' },
      createPrototype: () => createModuleNode(1, 'Sub-Graph Module'),
    },

    // ── 9. CUSTOM CONTROL PANELS ───────────────────────────────────────────────
    {
      id: 'control_panel',
      category: 'Controls',
      label: 'Custom UI Control Panel',
      defaultDescription: 'Tactile control interface with draggable faders, knobs, XY pads, triggers, OSC & MIDI learn',
      iconName: 'sliders',
      spawnType: { kind: 'control' },
      createPrototype: () => createControlNode(1),
    },
];
