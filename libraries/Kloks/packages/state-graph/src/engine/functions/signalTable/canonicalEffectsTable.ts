// ═══════════════════════════════════════════════════════════════════
// CANONICAL EFFECTS TABLE
// ═══════════════════════════════════════════════════════════════════
import { CanonicalEffectDefinition } from "./types";

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
    name: 'MIDI Note Repeater / Arp Echo',
    shortName: 'MIDI ECHO',
    auraColor: '#818cf8',
    description: 'Subdivides and repeats active MIDI note events flowing along the connection conduit',
  },
  'delay_midi': {
    effectType: 'delay',
    signalType: 'midi',
    name: 'MIDI Time Slew Delay',
    shortName: 'MIDI DELAY',
    auraColor: '#6366f1',
    description: 'Delays MIDI packet arrival along the wire conduit by specified beat durations',
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
