import { SpaceNode, EffectNode, SignalType } from "../types/index.js";
import { getNodeSockets } from '../core/nodeSocketRegistry';
export type { SignalType };

export interface SignalTypeDefinition {
  type: SignalType;
  name: string;
  shortName: string;
  colorHex: number;
  colorStr: string;
  bgStr: string;
  description: string;
  iconName?: string;
}

export const CANONICAL_SIGNAL_TYPES: Record<SignalType, SignalTypeDefinition> = {
  trigger: {
    type: 'trigger',
    name: 'Trigger Pulse',
    shortName: 'TRIG',
    colorHex: 0xffd700,
    colorStr: '#ffd700',
    bgStr: '#78350f',
    description: 'Instantaneous pulse events driving step clocks and sequencer gates',
    iconName: 'zap',
  },
  trigger_stream: {
    type: 'trigger_stream',
    name: 'Trigger Stream',
    shortName: 'TRIG STR',
    colorHex: 0xffd700,
    colorStr: '#ffd700',
    bgStr: '#78350f',
    description: 'Continuous stream of trigger pulses carrying timing in bars, beats, and fractions with optional code payload',
    iconName: 'zap',
  },
  trigger_packet: {
    type: 'trigger_packet',
    name: 'Trigger Packet (Clip)',
    shortName: 'TRIG PKT',
    colorHex: 0xfacc15,
    colorStr: '#facc15',
    bgStr: '#92400e',
    description: 'A series of trigger pulses placed across bars, beats, and beat fractions over a defined quantity of time',
    iconName: 'disc',
  },
  midi_stream: {
    type: 'midi_stream',
    name: 'MIDI Stream',
    shortName: 'MIDI STR',
    colorHex: 0xa855f7,
    colorStr: '#a855f7',
    bgStr: '#3b0764',
    description: 'Continuous real-time MIDI notes, velocity, and controller data stream',
    iconName: 'music',
  },
  midi_packet: {
    type: 'midi_packet',
    name: 'MIDI Packet (Clip)',
    shortName: 'MIDI PKT',
    colorHex: 0xc084fc,
    colorStr: '#c084fc',
    bgStr: '#581c87',
    description: 'Discrete packaged MIDI clip or recorded pattern container',
    iconName: 'disc',
  },
  midi: {
    type: 'midi',
    name: 'MIDI Note / Control',
    shortName: 'MIDI',
    colorHex: 0xa855f7,
    colorStr: '#a855f7',
    bgStr: '#3b0764',
    description: 'Polyphonic pitch, velocity, duration and expression note data',
    iconName: 'music',
  },
  audio_stream: {
    type: 'audio_stream',
    name: 'Audio Stream',
    shortName: 'AUD STR',
    colorHex: 0xf43f5e,
    colorStr: '#f43f5e',
    bgStr: '#4c0519',
    description: 'Continuous live acoustic audio waveform stream (hardware input/output, real-time playback)',
    iconName: 'volume-2',
  },
  audio_packet: {
    type: 'audio_packet',
    name: 'Audio Packet (Clip)',
    shortName: 'AUD PKT',
    colorHex: 0xfb7185,
    colorStr: '#fb7185',
    bgStr: '#881337',
    description: 'Discrete packaged audio sample clip / recorded buffer',
    iconName: 'disc',
  },
  audio_mono: {
    type: 'audio_mono',
    name: 'Audio Stream (Mono)',
    shortName: 'MONO',
    colorHex: 0x06b6d4,
    colorStr: '#06b6d4',
    bgStr: '#083344',
    description: 'Single-channel acoustic waveform stream (hardware mic/line inputs)',
    iconName: 'mic',
  },
  audio_stereo: {
    type: 'audio_stereo',
    name: 'Audio Stream (Stereo)',
    shortName: 'STEREO',
    colorHex: 0xec4899,
    colorStr: '#ec4899',
    bgStr: '#831843',
    description: 'Dual-channel (Left + Right) stereo acoustic waveform stream',
    iconName: 'headphones',
  },
  audio: {
    type: 'audio',
    name: 'Audio Stream (Generic)',
    shortName: 'AUD',
    colorHex: 0xf43f5e,
    colorStr: '#f43f5e',
    bgStr: '#4c0519',
    description: 'Real-time acoustic waveform data stream',
    iconName: 'volume-2',
  },
  curve_stream: {
    type: 'curve_stream',
    name: 'Curve Stream (CV)',
    shortName: 'CV STR',
    colorHex: 0x10b981,
    colorStr: '#10b981',
    bgStr: '#022c22',
    description: 'Continuous parametric control voltage and automation stream',
    iconName: 'trending-up',
  },
  curve_packet: {
    type: 'curve_packet',
    name: 'Curve Packet (Clip)',
    shortName: 'CV PKT',
    colorHex: 0x34d399,
    colorStr: '#34d399',
    bgStr: '#064e3b',
    description: 'Packaged curve envelope or discrete automation clip',
    iconName: 'disc',
  },
  curve: {
    type: 'curve',
    name: 'Curve / CV Modulation',
    shortName: 'CV',
    colorHex: 0x10b981,
    colorStr: '#10b981',
    bgStr: '#022c22',
    description: 'Continuous parametric control voltage and automation splines',
    iconName: 'trending-up',
  },
  component: {
    type: 'component',
    name: 'Component / Sample Link',
    shortName: 'COMP',
    colorHex: 0x10b981,
    colorStr: '#10b981',
    bgStr: '#064e3b',
    description: 'Component link binding container sample sources dynamically to host sampler nodes',
    iconName: 'box',
  },
  effect: {
    type: 'effect',
    name: 'Spatial Effect Field',
    shortName: 'FX',
    colorHex: 0x8b5cf6,
    colorStr: '#8b5cf6',
    bgStr: '#2e1065',
    description: 'Spatial field modifier radiating real-time DSP modulation across passing wire conduits',
    iconName: 'rotate-cw',
  },
  omni_packet: {
    type: 'omni_packet',
    name: 'Omni Packet',
    shortName: 'OMNI PKT',
    colorHex: 0x818cf8,
    colorStr: '#818cf8',
    bgStr: '#312e81',
    description: 'Universal packet receptacle accepting all discrete signal packets (Audio, MIDI, Curve)',
    iconName: 'package',
  },
  omni_stream: {
    type: 'omni_stream',
    name: 'Omni Stream',
    shortName: 'OMNI STR',
    colorHex: 0x6366f1,
    colorStr: '#6366f1',
    bgStr: '#1e1b4b',
    description: 'Universal stream receptacle accepting any continuous stream signal',
    iconName: 'layers',
  },
  omni: {
    type: 'omni',
    name: 'Omni Universal Signal',
    shortName: 'OMNI',
    colorHex: 0x818cf8,
    colorStr: '#818cf8',
    bgStr: '#312e81',
    description: 'Universal polymorphic signal connection',
    iconName: 'box',
  },
  string: {
    type: 'string',
    name: 'Primitive String',
    shortName: 'STR',
    colorHex: 0xff00ff,
    colorStr: '#ff00ff',
    bgStr: '#701a75',
    description: 'Primitive text string value parameter',
    iconName: 'type',
  },
  number: {
    type: 'number',
    name: 'Primitive Number',
    shortName: 'NUM',
    colorHex: 0x22c55e,
    colorStr: '#22c55e',
    bgStr: '#052e16',
    description: 'Primitive numeric value parameter',
    iconName: 'hash',
  },
  boolean: {
    type: 'boolean',
    name: 'Primitive Boolean',
    shortName: 'BOOL',
    colorHex: 0xef4444,
    colorStr: '#ef4444',
    bgStr: '#450a0a',
    description: 'Primitive boolean true/false toggle flag',
    iconName: 'toggle-left',
  },
  object: {
    type: 'object',
    name: 'Primitive Object / JSON',
    shortName: 'OBJ',
    colorHex: 0x1d4ed8,
    colorStr: '#1d4ed8',
    bgStr: '#1e3a8a',
    description: 'Structured key-value dictionary and folders object',
    iconName: 'braces',
  },
  array: {
    type: 'array',
    name: 'Primitive List / Array',
    shortName: 'LIST',
    colorHex: 0x14b8a6,
    colorStr: '#14b8a6',
    bgStr: '#134e4a',
    description: 'Ordered collection or list of items',
    iconName: 'layers',
  },
};

export const SIGNAL_TYPES = CANONICAL_SIGNAL_TYPES;

export interface CanonicalEffectDefinition {
  effectType: 'repeater' | 'delay' | 'gain' | 'pan' | 'velocity';
  signalType: SignalType;
  name: string;
  shortName: string;
  auraColor: string;
  description: string;
}

export const CANONICAL_EFFECTS_TABLE: Record<string, CanonicalEffectDefinition> = {
  'gain_audio': {
    effectType: 'gain',
    signalType: 'audio',
    name: 'Audio Gain Orb',
    shortName: 'AUD GAIN',
    auraColor: '#f43f5e',
    description: 'Modulates amplitude volume scaling (0% to 200%) for both mono and stereo audio streams',
  },
  'pan_audio_stereo': {
    effectType: 'pan',
    signalType: 'audio_stereo',
    name: 'Audio Stereo Pan Orb',
    shortName: 'AUD PAN',
    auraColor: '#ec4899',
    description: 'Modulates stereo panning balance (-100% Left to +100% Right) exclusively for stereo audio streams',
  },
  'velocity_midi': {
    effectType: 'velocity',
    signalType: 'midi',
    name: 'MIDI Note Velocity Scaler',
    shortName: 'MIDI VEL',
    auraColor: '#0ea5e9',
    description: 'Modulates note velocity multipliers, dynamic offsets, and humanization jitter for MIDI wires',
  },
  'repeater_trigger': {
    effectType: 'repeater',
    signalType: 'trigger',
    name: 'Chrono Pulse Repeater',
    shortName: 'TRIG REPEAT',
    auraColor: '#c084fc',
    description: 'Multiplies and echoes trigger clock pulses traveling along the wire conduit',
  },
  'delay_trigger': {
    effectType: 'delay',
    signalType: 'trigger',
    name: 'Trigger Time Slew Delay',
    shortName: 'TRIG DELAY',
    auraColor: '#a855f7',
    description: 'Delays trigger pulse arrival along the wire conduit by specified musical beats',
  },
  'repeater_midi': {
    effectType: 'repeater',
    signalType: 'midi',
    name: 'MIDI Note Velocity Echo',
    shortName: 'MIDI REPEAT',
    auraColor: '#38bdf8',
    description: 'Repeats polyphonic MIDI note events with velocity decay along the wire conduit',
  },
  'delay_midi': {
    effectType: 'delay',
    signalType: 'midi',
    name: 'MIDI Beat Echo Delay',
    shortName: 'MIDI DELAY',
    auraColor: '#0ea5e9',
    description: 'Delays MIDI note transmission along the wire conduit by musical subdivisions',
  },
  'repeater_audio': {
    effectType: 'repeater',
    signalType: 'audio',
    name: 'Audio Granular Stutter',
    shortName: 'AUD STUTTER',
    auraColor: '#fb7185',
    description: 'Creates rhythmic audio buffer repetitions and stutter bursts along the road conduit',
  },
  'delay_audio': {
    effectType: 'delay',
    signalType: 'audio',
    name: 'Acoustic Feedback Delay',
    shortName: 'AUD DELAY',
    auraColor: '#f43f5e',
    description: 'Applies wet/dry audio delay and feedback decay to acoustic streams through the wire',
  },
  'repeater_curve': {
    effectType: 'repeater',
    signalType: 'curve',
    name: 'Curve Modulation Multiplier',
    shortName: 'CV MULTIPLY',
    auraColor: '#34d399',
    description: 'Subdivides and repeats CV envelope modulation splines flowing through the wire',
  },
  'delay_curve': {
    effectType: 'delay',
    signalType: 'curve',
    name: 'Curve Slew / Lag Buffer',
    shortName: 'CV LAG',
    auraColor: '#10b981',
    description: 'Adds phase delay and slew smoothing to CV modulation curves in the conduit',
  },
};

/**
 * Resolves the primary output signal type emitted by any given node archetype dynamically.
 */
export function getNodeOutputSignalType(node: SpaceNode): SignalType {
  const { outputs } = getNodeSockets(node);
  if (outputs.length > 0) {
    return outputs[0].signalType;
  }
  if (node.type === 'effect') {
    return (node as EffectNode).signalType || 'trigger';
  }
  return 'trigger';
}

/**
 * Resolves the primary input signal type accepted by any given node archetype dynamically.
 */
export function getNodeInputSignalType(node: SpaceNode): SignalType {
  const { inputs } = getNodeSockets(node);
  if (inputs.length > 0) {
    return inputs[0].signalType;
  }
  if (node.type === 'effect') {
    return (node as EffectNode).signalType || 'trigger';
  }
  return 'trigger';
}

/**
 * Returns all accepted input signals for nodes dynamically by inspecting their socket definitions.
 */
export function getNodeAcceptedInputSignals(node: SpaceNode): SignalType[] {
  const { inputs } = getNodeSockets(node);
  if (inputs.length > 0) {
    const sigs = new Set<SignalType>();
    for (const inp of inputs) {
      sigs.add(inp.signalType);
      // Include compatible medium shortcuts if applicable
      if (inp.medium === 'audio_stereo') {
        sigs.add('audio_stereo');
        sigs.add('audio');
        sigs.add('audio_stream');
      } else if (inp.medium === 'audio_mono') {
        sigs.add('audio_mono');
        sigs.add('audio');
        sigs.add('audio_stream');
      } else if (inp.medium === 'midi') {
        sigs.add('midi');
        sigs.add('midi_stream');
      } else if (inp.medium === 'curve') {
        sigs.add('curve');
        sigs.add('curve_stream');
      } else if (inp.medium === 'trigger') {
        sigs.add('trigger');
      }
    }
    return Array.from(sigs);
  }
  if (node.type === 'effect') {
    return [(node as EffectNode).signalType || 'trigger'];
  }
  return ['trigger'];
}
