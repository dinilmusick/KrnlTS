// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { SpaceNode, NodeCategoryKey, NodeMeshSetting } from "../types/index.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS, INTERFACES & TYPES (Pluggable 2D & 3D Asset System)
// ══════════════════════════════════════════════════════════════════════════════════════════

export type RenderEngineMode = '3d' | '2d';

/**
 * 2D Sprite Visual Specification for a Node Archetype
 */
export interface Node2DSpriteSetting {
  spriteId: string;
  spriteName: string;
  category: 'container' | 'trigger' | 'effect' | 'io' | 'router' | 'module' | 'converter' | 'data';
  subType: string;
  iconName: string; // Lucide icon identifier
  accentColor: string;
  secondaryColor: string;
  badgeText: string;
  dimensions: { width: number; height: number };
  glowColor: string;
  themeStyle: 'fantasy_rts' | 'sci_fi_matrix' | 'neo_brutalist';
  description: string;
  role: string;
}

/**
 * Combined Pluggable Asset Definition for any Node
 */
export interface PluggableNodeAsset {
  nodeType: string;
  subType?: string;
  name: string;
  asset3D: NodeMeshSetting;
  asset2D: Node2DSpriteSetting;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. CANONICAL NODE ASSET CATALOG (2D Sprites & 3D Meshes)
// ══════════════════════════════════════════════════════════════════════════════════════════

export const DEFAULT_2D_SPRITES: Record<string, Node2DSpriteSetting> = {
  container_midi_castle: {
    spriteId: 'castle_keep_2d',
    spriteName: 'Castle Keep (Citadel)',
    category: 'container',
    subType: 'midi',
    iconName: 'Castle',
    accentColor: '#f59e0b',
    secondaryColor: '#b45309',
    badgeText: 'MIDI CITADEL',
    dimensions: { width: 140, height: 110 },
    glowColor: 'rgba(245, 158, 11, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Central citadel housing polyphonic harmony, lead arps & chord loops',
    role: 'MIDI Melody & Chord Hub',
  },
  container_midi_wizard: {
    spriteId: 'wizard_spire_2d',
    spriteName: 'Wizard Tower',
    category: 'container',
    subType: 'midi',
    iconName: 'Sparkles',
    accentColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    badgeText: 'ARCANE PAD',
    dimensions: { width: 140, height: 110 },
    glowColor: 'rgba(59, 130, 246, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Arcane spire casting ethereal pad atmospheres and floating octave runs',
    role: 'Ambient Pad Synth',
  },
  container_midi_forge: {
    spriteId: 'dwarven_forge_2d',
    spriteName: 'Blacksmith Forge',
    category: 'container',
    subType: 'midi',
    iconName: 'Flame',
    accentColor: '#ef4444',
    secondaryColor: '#991b1b',
    badgeText: 'BASS FOUNDRY',
    dimensions: { width: 140, height: 110 },
    glowColor: 'rgba(239, 68, 68, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Foundry hammering heavy sub-bass lines, distorted FM basses & 808s',
    role: 'Bass & 808 Foundry',
  },
  container_audio: {
    spriteId: 'barracks_camp_2d',
    spriteName: 'Barracks & War Camp',
    category: 'container',
    subType: 'audio',
    iconName: 'FileAudio',
    accentColor: '#dc2626',
    secondaryColor: '#7f1d1d',
    badgeText: 'AUDIO STEMS',
    dimensions: { width: 140, height: 110 },
    glowColor: 'rgba(220, 38, 38, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'War lodge holding acoustic drums, war horns, marching stems and audio samples',
    role: 'Percussion & Audio Stems',
  },
  container_curve: {
    spriteId: 'alchemist_lab_2d',
    spriteName: 'Alchemist Lab',
    category: 'container',
    subType: 'curve',
    iconName: 'Activity',
    accentColor: '#06b6d4',
    secondaryColor: '#0e7490',
    badgeText: 'LFO CURVES',
    dimensions: { width: 140, height: 110 },
    glowColor: 'rgba(6, 182, 212, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Laboratory brewing continuous modulation curves, cutoff sweeps & LFO potions',
    role: 'Automation & LFO Curves',
  },
  container_instrument: {
    spriteId: 'instrument_hall_2d',
    spriteName: 'Synthesizer Instrument',
    category: 'container',
    subType: 'instrument',
    iconName: 'Music',
    accentColor: '#10b981',
    secondaryColor: '#047857',
    badgeText: 'INSTRUMENT',
    dimensions: { width: 140, height: 110 },
    glowColor: 'rgba(16, 185, 129, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Polyphonic synthesizer with filter and envelope modulation controls',
    role: 'Instrument Synth',
  },
  trigger_beats: {
    spriteId: 'mana_obelisk_2d',
    spriteName: 'Beats Sequencer',
    category: 'trigger',
    subType: 'beats',
    iconName: 'Zap',
    accentColor: '#fbbf24',
    secondaryColor: '#d97706',
    badgeText: 'BEATS SEQUENCER',
    dimensions: { width: 170, height: 80 },
    glowColor: 'rgba(251, 191, 36, 0.4)',
    themeStyle: 'fantasy_rts',
    description: '1-bar step sequencer emitting quantized beat trigger pulses',
    role: 'Beats Step Sequencer',
  },
  trigger_beat_fractions: {
    spriteId: 'mana_obelisk_2d',
    spriteName: 'Beat Fractions Sequencer',
    category: 'trigger',
    subType: 'beat_fractions',
    iconName: 'Clock',
    accentColor: '#fbbf24',
    secondaryColor: '#d97706',
    badgeText: 'FRACTIONS SEQUENCER',
    dimensions: { width: 250, height: 100 },
    glowColor: 'rgba(251, 191, 36, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Subdivided rhythmic fraction step sequencer emitting sub-beat pulses',
    role: 'Fractions Step Sequencer',
  },
  effect_repeater: {
    spriteId: 'effect_repeater_2d',
    spriteName: 'Repeater Pulse Orb',
    category: 'effect',
    subType: 'repeater',
    iconName: 'RotateCw',
    accentColor: '#fbbf24',
    secondaryColor: '#b45309',
    badgeText: 'PULSE REPEATER',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(251, 191, 36, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Spatial field creating burst echo repeats and rhythmic ratchets for wires',
    role: 'Rhythm Ratchet Orb',
  },
  effect_delay: {
    spriteId: 'effect_delay_2d',
    spriteName: 'Echo Delay Orb',
    category: 'effect',
    subType: 'delay',
    iconName: 'Clock',
    accentColor: '#06b6d4',
    secondaryColor: '#0891b2',
    badgeText: 'TAPE DELAY',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(6, 182, 212, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Spatial audio delay chamber adding stereo reflections & tape echo decay',
    role: 'Spatial Delay Field',
  },
  effect_eq: {
    spriteId: 'effect_eq_2d',
    spriteName: 'Parametric EQ Orb',
    category: 'effect',
    subType: 'eq',
    iconName: 'Sliders',
    accentColor: '#06b6d4',
    secondaryColor: '#0891b2',
    badgeText: 'PARAMETRIC EQ',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(6, 182, 212, 0.5)',
    themeStyle: 'fantasy_rts',
    description: '4-Band precision parametric equalizer with shelving and peaking filters',
    role: 'Equalizer Tone Shaper',
  },
  effect_compressor: {
    spriteId: 'effect_compressor_2d',
    spriteName: 'Studio Compressor Orb',
    category: 'effect',
    subType: 'compressor',
    iconName: 'Activity',
    accentColor: '#f59e0b',
    secondaryColor: '#d97706',
    badgeText: 'COMPRESSOR',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(245, 158, 11, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Dynamic range compressor with threshold, ratio, attack, release, and sidechain key ducking',
    role: 'Dynamics & Ducking',
  },
  effect_multiband_compressor: {
    spriteId: 'effect_multiband_compressor_2d',
    spriteName: 'Multiband Compressor Orb',
    category: 'effect',
    subType: 'multiband_compressor',
    iconName: 'Layers',
    accentColor: '#d97706',
    secondaryColor: '#b45309',
    badgeText: 'MULTIBAND COMP',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(217, 119, 6, 0.5)',
    themeStyle: 'fantasy_rts',
    description: '3-Band crossover dynamic compressor with selective band sidechain ducking',
    role: 'Multiband Dynamics',
  },
  effect_limiter: {
    spriteId: 'effect_limiter_2d',
    spriteName: 'Peak Limiter Orb',
    category: 'effect',
    subType: 'limiter',
    iconName: 'Shield',
    accentColor: '#ef4444',
    secondaryColor: '#b91c1c',
    badgeText: 'PEAK LIMITER',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(239, 68, 68, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Brickwall peak limiter with zero overshoot and soft-clipping saturation',
    role: 'Mastering Limiter',
  },
  effect_reverb: {
    spriteId: 'effect_reverb_2d',
    spriteName: 'Studio Reverb Orb',
    category: 'effect',
    subType: 'reverb',
    iconName: 'Waves',
    accentColor: '#8b5cf6',
    secondaryColor: '#6d28d9',
    badgeText: 'STUDIO REVERB',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(139, 92, 246, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Stereo algorithmic room/hall reverb with frequency damping & width controls',
    role: 'Acoustic Space Reverb',
  },
  effect_saturation: {
    spriteId: 'effect_saturation_2d',
    spriteName: 'Harmonic Saturation Orb',
    category: 'effect',
    subType: 'saturation',
    iconName: 'Zap',
    accentColor: '#f97316',
    secondaryColor: '#c2410c',
    badgeText: 'SATURATION',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(249, 115, 22, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Analog tape & vacuum tube harmonic drive with non-linear waveshaping',
    role: 'Harmonic Drive Shaper',
  },
  effect_pan: {
    spriteId: 'effect_pan_2d',
    spriteName: 'Stereo Panner Orb',
    category: 'effect',
    subType: 'pan',
    iconName: 'Sliders',
    accentColor: '#ec4899',
    secondaryColor: '#be185d',
    badgeText: 'STEREO PAN',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(236, 72, 153, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Stereo spatial field panning controller',
    role: 'Stereo Positioning',
  },
  effect_gain: {
    spriteId: 'effect_gain_2d',
    spriteName: 'Gain Boost Orb',
    category: 'effect',
    subType: 'gain',
    iconName: 'Volume2',
    accentColor: '#ec4899',
    secondaryColor: '#be185d',
    badgeText: 'GAIN AMPLIFIER',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(236, 72, 153, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Spatial amplifier scaling signal velocity and audio decibels',
    role: 'Gain Field',
  },
  effect_velocity: {
    spriteId: 'effect_velocity_2d',
    spriteName: 'Velocity Shaper Orb',
    category: 'effect',
    subType: 'velocity',
    iconName: 'Zap',
    accentColor: '#10b981',
    secondaryColor: '#047857',
    badgeText: 'VELOCITY SHAPER',
    dimensions: { width: 120, height: 100 },
    glowColor: 'rgba(16, 185, 129, 0.5)',
    themeStyle: 'fantasy_rts',
    description: 'Dynamic velocity scaling and randomization field for MIDI lines',
    role: 'Velocity Field',
  },
  combiner: {
    spriteId: 'combiner_2d',
    spriteName: 'Signal Fusion Combiner',
    category: 'router',
    subType: 'combiner',
    iconName: 'GitMerge',
    accentColor: '#f97316',
    secondaryColor: '#c2410c',
    badgeText: 'SIGNAL COMBINER',
    dimensions: { width: 135, height: 110 },
    glowColor: 'rgba(249, 115, 22, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Multi-port signal summing and blending hub',
    role: 'Signal Mixer Hub',
  },
  multiplexer: {
    spriteId: 'multiplexer_2d',
    spriteName: 'Signal Split Multiplexer',
    category: 'router',
    subType: 'multiplexer',
    iconName: 'Split',
    accentColor: '#8b5cf6',
    secondaryColor: '#5b21b6',
    badgeText: 'MULTIPLEXER',
    dimensions: { width: 135, height: 110 },
    glowColor: 'rgba(139, 92, 246, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Signal distributor broadcasting or alternating channels across outputs',
    role: 'Signal Distributor',
  },
  module: {
    spriteId: 'module_2d',
    spriteName: 'Sub-Graph Modular Chip',
    category: 'module',
    subType: 'module',
    iconName: 'Cpu',
    accentColor: '#a855f7',
    secondaryColor: '#6b21a8',
    badgeText: 'NESTED SUB-GRAPH',
    dimensions: { width: 145, height: 115 },
    glowColor: 'rgba(168, 85, 247, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Encapsulated sub-graph module with dynamic socket I/O mapping',
    role: 'Sub-Graph Module',
  },
  group: {
    spriteId: 'group_node_2d',
    spriteName: 'Collapsed Node Group',
    category: 'module',
    subType: 'group',
    iconName: 'Layers',
    accentColor: '#8b5cf6',
    secondaryColor: '#6d28d9',
    badgeText: 'NODE GROUP',
    dimensions: { width: 180, height: 120 },
    glowColor: 'rgba(139, 92, 246, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Collapsed container representation preserving internal node group',
    role: 'Node Group Container',
  },
  subgraph: {
    spriteId: 'subgraph_node_2d',
    spriteName: 'Reusable Subgraph Node',
    category: 'module',
    subType: 'subgraph',
    iconName: 'Box',
    accentColor: '#06b6d4',
    secondaryColor: '#0891b2',
    badgeText: 'SUBGRAPH',
    dimensions: { width: 220, height: 140 },
    glowColor: 'rgba(6, 182, 212, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Reusable invocation of a saved Workspace graph with derived logical Stream I/O',
    role: 'Reusable Subgraph Invocation',
  },
  converter: {
    spriteId: 'converter_2d',
    spriteName: 'Channel Audio Converter',
    category: 'converter',
    subType: 'converter',
    iconName: 'Repeat',
    accentColor: '#06b6d4',
    secondaryColor: '#0891b2',
    badgeText: 'MONO/STEREO CONVERTER',
    dimensions: { width: 130, height: 100 },
    glowColor: 'rgba(6, 182, 212, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Converts stereo audio to mono or expands mono audio to dual-mono stereo',
    role: 'Audio Format Converter',
  },
  button: {
    spriteId: 'button_2d',
    spriteName: 'Interactive Button',
    category: 'trigger',
    subType: 'button',
    iconName: 'Circle',
    accentColor: '#10b981',
    secondaryColor: '#047857',
    badgeText: 'TRIGGER BUTTON',
    dimensions: { width: 100, height: 100 },
    glowColor: 'rgba(16, 185, 129, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Manual trigger button. Sends a pulse on click or state toggle.',
    role: 'Manual Pulse Trigger',
  },
  arrangement: {
    spriteId: 'arrangement_timeline_2d',
    spriteName: 'Arrangement Timeline',
    category: 'module',
    subType: 'arrangement',
    iconName: 'Calendar',
    accentColor: '#818cf8',
    secondaryColor: '#4f46e5',
    badgeText: 'DAW TIMELINE',
    dimensions: { width: 600, height: 300 },
    glowColor: 'rgba(129, 140, 248, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Multi-layer DAW arrangement timeline node with signal purity and real-time container clip syncing',
    role: 'Arrangement & Timeline Sequencer',
  },
  code: {
    spriteId: 'code_node_2d',
    spriteName: 'JavaScript Code Node',
    category: 'trigger',
    subType: 'code',
    iconName: 'Code',
    accentColor: '#f59e0b',
    secondaryColor: '#b45309',
    badgeText: 'JS CODE',
    dimensions: { width: 380, height: 260 },
    glowColor: 'rgba(245, 158, 11, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Enriches trigger stream pulses with custom JavaScript code payload via built-in Monaco editor',
    role: 'Trigger Stream Code Injector',
  },
  input_strip: {
    spriteId: 'input_strip_2d',
    spriteName: 'Input Strip Landmark',
    category: 'io',
    subType: 'input_strip',
    iconName: 'LogIn',
    accentColor: '#f59e0b',
    secondaryColor: '#b45309',
    badgeText: 'INPUT STRIP',
    dimensions: { width: 140, height: 80 },
    glowColor: 'rgba(245, 158, 11, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Central input landmark delivering external audio, MIDI & triggers into the graph',
    role: 'Input Gateway',
  },
  output_strip: {
    spriteId: 'output_strip_2d',
    spriteName: 'Output Strip Landmark',
    category: 'io',
    subType: 'output_strip',
    iconName: 'LogOut',
    accentColor: '#10b981',
    secondaryColor: '#059669',
    badgeText: 'OUTPUT STRIP',
    dimensions: { width: 140, height: 80 },
    glowColor: 'rgba(16, 185, 129, 0.4)',
    themeStyle: 'fantasy_rts',
    description: 'Central master output gateway routing audio and MIDI out of the graph',
    role: 'Output Gateway',
  },
  primitive_string: {
    spriteId: 'primitive_string_2d',
    spriteName: 'String Primitive',
    category: 'data',
    subType: 'string',
    iconName: 'Type',
    accentColor: '#06b6d4',
    secondaryColor: '#0891b2',
    badgeText: 'STRING',
    dimensions: { width: 180, height: 100 },
    glowColor: 'rgba(6, 182, 212, 0.4)',
    themeStyle: 'sci_fi_matrix',
    description: 'Text string primitive value parameter for file names, labels, and parameters',
    role: 'String Parameter',
  },
  primitive_number: {
    spriteId: 'primitive_number_2d',
    spriteName: 'Number Primitive',
    category: 'data',
    subType: 'number',
    iconName: 'Hash',
    accentColor: '#f97316',
    secondaryColor: '#ea580c',
    badgeText: 'NUMBER',
    dimensions: { width: 170, height: 95 },
    glowColor: 'rgba(249, 115, 22, 0.4)',
    themeStyle: 'sci_fi_matrix',
    description: 'Numerical parameter with live slider, steppers, and range constraints',
    role: 'Numeric Parameter',
  },
  primitive_boolean: {
    spriteId: 'primitive_boolean_2d',
    spriteName: 'Boolean Primitive',
    category: 'data',
    subType: 'boolean',
    iconName: 'ToggleLeft',
    accentColor: '#a855f7',
    secondaryColor: '#9333ea',
    badgeText: 'BOOLEAN',
    dimensions: { width: 140, height: 90 },
    glowColor: 'rgba(168, 85, 247, 0.4)',
    themeStyle: 'sci_fi_matrix',
    description: 'Boolean true/false toggle switch parameter',
    role: 'Boolean Flag',
  },
  primitive_object: {
    spriteId: 'primitive_object_2d',
    spriteName: 'Object / JSON Primitive',
    category: 'data',
    subType: 'object',
    iconName: 'Braces',
    accentColor: '#3b82f6',
    secondaryColor: '#2563eb',
    badgeText: 'OBJECT',
    dimensions: { width: 210, height: 130 },
    glowColor: 'rgba(59, 130, 246, 0.4)',
    themeStyle: 'sci_fi_matrix',
    description: 'Structured JSON dictionary object and key-value payload generator',
    role: 'Object Dictionary',
  },
  folder_path: {
    spriteId: 'folder_path_2d',
    spriteName: 'Folder Path Access',
    category: 'data',
    subType: 'folder_path',
    iconName: 'Folder',
    accentColor: '#ec4899',
    secondaryColor: '#db2777',
    badgeText: 'FOLDER ACCESS',
    dimensions: { width: 220, height: 145 },
    glowColor: 'rgba(236, 72, 153, 0.4)',
    themeStyle: 'sci_fi_matrix',
    description: 'Queries user defined folders and outputs structured folders object and selected path',
    role: 'Folder Path Gateway',
  },
};

// ══════════════════════════════════════════════════════════════════════════════════════════
// 4. PLUGGABLE ASSET REGISTRY CLASS
// ══════════════════════════════════════════════════════════════════════════════════════════

export class NodeAssetRegistry {
  private static spriteOverrides: Map<string, Partial<Node2DSpriteSetting>> = new Map();
  private static meshOverrides: Map<string, Partial<NodeMeshSetting>> = new Map();

  /**
   * Resolves the canonical sprite descriptor key for any SpaceNode.
   */
  public static getNodeAssetKey(node: SpaceNode): string {
    if (node.type === 'container') {
      const cType = (node as any).containerType || 'midi';
      if (cType === 'midi') {
        const nameLower = (node.name || '').toLowerCase();
        if (nameLower.includes('wizard') || nameLower.includes('pad') || nameLower.includes('spire')) {
          return 'container_midi_wizard';
        }
        if (nameLower.includes('forge') || nameLower.includes('bass') || nameLower.includes('808')) {
          return 'container_midi_forge';
        }
        return 'container_midi_castle';
      }
      if (cType === 'audio') return 'container_audio';
      if (cType === 'curve') return 'container_curve';
      if (cType === 'instrument') return 'container_instrument';
      return 'container_midi_castle';
    }

    if (node.type === 'trigger') {
      return node.triggerType === 'beat_fractions' ? 'trigger_beat_fractions' : 'trigger_beats';
    }

    if (node.type === 'effect') {
      return `effect_${(node as any).effectType || 'repeater'}`;
    }

    if (node.type === 'combiner') return 'combiner';
    if (node.type === 'multiplexer') return 'multiplexer';
    if (node.type === 'module') return 'module';
    if ((node.type as string) === 'group') return 'group';
    if ((node.type as string) === 'subgraph') return 'subgraph';
    if (node.type === 'converter') return 'converter';
    if (node.type === 'button') return 'button';
    if (node.type === 'arrangement') return 'arrangement';
    if (node.type === 'code') return 'code';
    if (node.type === 'input_strip') return 'input_strip';
    if (node.type === 'output_strip') return 'output_strip';
    if (node.type === 'primitive_string') return 'primitive_string';
    if (node.type === 'primitive_number') return 'primitive_number';
    if (node.type === 'primitive_boolean') return 'primitive_boolean';
    if (node.type === 'primitive_object') return 'primitive_object';
    if (node.type === 'folder_path') return 'folder_path';

    return 'container_midi_castle';
  }

  /**
   * Retrieves the 2D Sprite specification for a node.
   */
  public static get2DSpriteSetting(node: SpaceNode): Node2DSpriteSetting {
    const key = this.getNodeAssetKey(node);
    const base = DEFAULT_2D_SPRITES[key] || DEFAULT_2D_SPRITES.container_midi_castle;
    const override = this.spriteOverrides.get(node.id) || {};

    return {
      ...base,
      ...override,
      spriteName: node.name || base.spriteName,
      accentColor: (override.accentColor || (node as any).color || base.accentColor),
    };
  }

  /**
   * Plugs a custom 2D sprite configuration onto a node or category.
   */
  public static register2DSpriteOverride(nodeId: string, override: Partial<Node2DSpriteSetting>): void {
    this.spriteOverrides.set(nodeId, override);
  }

  /**
   * Plugs a custom 3D mesh configuration onto a node or category.
   */
  public static register3DMeshOverride(nodeId: string, override: Partial<NodeMeshSetting>): void {
    this.meshOverrides.set(nodeId, override);
  }
}
