/**
 * @file graphTypeSystem.ts
 * @description Extensible Graph Type Classification System for Qwnsr Graph Packages.
 * Provides over-defined, granular classifications with metadata and capabilities.
 */

export type GraphType =
  | 'intro_motif'
  | 'arrangement'
  | 'song'
  | 'performance'
  | 'synth_patch'
  | 'fx_chain'
  | 'rhythm_beat'
  | 'generative'
  | 'live_set'
  | 'utility_macro'
  | 'custom';

export interface GraphTypeDefinition {
  id: GraphType;
  label: string;
  category: 'Composition' | 'Performance' | 'Sound Design' | 'Utility' | 'Experimental';
  description: string;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
  iconName: string;
  defaultBpm: number;
  recommendedNodes: string[];
}

export const GRAPH_TYPE_DEFINITIONS: Record<GraphType, GraphTypeDefinition> = {
  intro_motif: {
    id: 'intro_motif',
    label: 'Intro / Motif',
    category: 'Composition',
    description: 'Hook, thematic motif, melodic ostinato, or musical intro sequence',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#0284c7',
    iconName: 'Sparkles',
    defaultBpm: 120,
    recommendedNodes: ['trigger', 'container', 'effect'],
  },
  arrangement: {
    id: 'arrangement',
    label: 'Arrangement',
    category: 'Composition',
    description: 'Timeline-ordered multitrack arrangement and structured song form sections',
    badgeColor: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#7e22ce',
    iconName: 'Layers',
    defaultBpm: 120,
    recommendedNodes: ['arrangement', 'container', 'effect', 'input_strip', 'output_strip'],
  },
  song: {
    id: 'song',
    label: 'Song',
    category: 'Composition',
    description: 'Complete musical work combining multiple motifs, verses, choruses, and stems',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#b45309',
    iconName: 'Music',
    defaultBpm: 124,
    recommendedNodes: ['arrangement', 'container', 'module', 'output_strip'],
  },
  performance: {
    id: 'performance',
    label: 'Performance',
    category: 'Performance',
    description: 'Live interactive matrix with mapped MIDI/OSC controls, pads, and real-time triggers',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#047857',
    iconName: 'Activity',
    defaultBpm: 128,
    recommendedNodes: ['control', 'audio_pads', 'button', 'trigger', 'effect'],
  },
  synth_patch: {
    id: 'synth_patch',
    label: 'Synth Patch / Sound Design',
    category: 'Sound Design',
    description: 'Self-contained modular synthesizer patch or acoustic instrument instrument package',
    badgeColor: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#be185d',
    iconName: 'Radio',
    defaultBpm: 120,
    recommendedNodes: ['container', 'effect', 'combiner', 'converter'],
  },
  fx_chain: {
    id: 'fx_chain',
    label: 'Audio FX Chain',
    category: 'Sound Design',
    description: 'Chained processing rack with EQ, dynamics, delay, modulation, and spatial reverb',
    badgeColor: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#0e7490',
    iconName: 'Sliders',
    defaultBpm: 120,
    recommendedNodes: ['effect', 'combiner', 'multiplexer'],
  },
  rhythm_beat: {
    id: 'rhythm_beat',
    label: 'Rhythm / Beat Grid',
    category: 'Composition',
    description: 'Euclidean pulse generator, drum sample matrix, and rhythmic trigger sequencer',
    badgeColor: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#c2410c',
    iconName: 'Grid',
    defaultBpm: 130,
    recommendedNodes: ['trigger', 'audio_pads', 'container'],
  },
  generative: {
    id: 'generative',
    label: 'Generative Algorithmic',
    category: 'Experimental',
    description: 'Algorithmic procedural music generator utilizing code nodes and probabilistic rules',
    badgeColor: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#6d28d9',
    iconName: 'Code',
    defaultBpm: 110,
    recommendedNodes: ['code', 'trigger', 'primitive_number', 'primitive_object'],
  },
  live_set: {
    id: 'live_set',
    label: 'Live Set / Session',
    category: 'Performance',
    description: 'Master live session setup integrating multiple imported song packages and cue strips',
    badgeColor: '#e11d48',
    badgeBg: 'rgba(225, 29, 72, 0.15)',
    borderColor: '#9f1239',
    iconName: 'PlayCircle',
    defaultBpm: 126,
    recommendedNodes: ['input_strip', 'output_strip', 'control', 'arrangement'],
  },
  utility_macro: {
    id: 'utility_macro',
    label: 'Utility / Macro',
    category: 'Utility',
    description: 'Signal multiplexers, stereo/mono converters, math routers, and bus utilities',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    borderColor: '#475569',
    iconName: 'Cpu',
    defaultBpm: 120,
    recommendedNodes: ['converter', 'combiner', 'multiplexer', 'primitive_string'],
  },
  custom: {
    id: 'custom',
    label: 'Custom / Experimental',
    category: 'Experimental',
    description: 'Freeform experimental node package with custom user-defined metadata tag',
    badgeColor: '#14b8a6',
    badgeBg: 'rgba(20, 184, 166, 0.15)',
    borderColor: '#0f766e',
    iconName: 'Box',
    defaultBpm: 120,
    recommendedNodes: ['container', 'trigger', 'effect', 'module'],
  },
};

export const ALL_GRAPH_TYPES: GraphType[] = Object.keys(GRAPH_TYPE_DEFINITIONS) as GraphType[];

export function getGraphTypeDefinition(type: string | undefined): GraphTypeDefinition {
  if (type && type in GRAPH_TYPE_DEFINITIONS) {
    return GRAPH_TYPE_DEFINITIONS[type as GraphType];
  }
  return GRAPH_TYPE_DEFINITIONS.custom;
}
