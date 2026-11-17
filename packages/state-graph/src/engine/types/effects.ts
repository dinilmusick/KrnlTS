// ═══════════════════════════════════════════════════════════════════
// EFFECT TYPES & DSP CONFIGS
// ═══════════════════════════════════════════════════════════════════

export type EffectType =
  | 'repeater'
  | 'delay'
  | 'gain'
  | 'pan'
  | 'velocity'
  | 'eq'
  | 'compressor'
  | 'multiband_compressor'
  | 'limiter'
  | 'reverb'
  | 'saturation';

export type AffectableNodeType = 'trigger' | 'container';

export interface RepeaterEffectConfig {
  repeats: number; // 1 to 16 repeat pulses (default 3)
  repeatIntervalBeats: number; // in beats, e.g. 0.125, 0.25, 0.5, 1.0 (default 0.25)
  decay: number; // 0.0 to 1.0 velocity/gain decay per repeat (default 0.8)
}

export interface DelayEffectConfig {
  delayBeats: number; // in beats, e.g. 0.25, 0.5, 1.0, 2.0 (default 0.5)
  feedback: number; // 0.0 to 0.95 feedback decay (default 0.4)
  wetMix: number; // 0.0 to 1.0 (default 0.6)
  highCut?: number; // lowpass filter cutoff on feedback in Hz (default 6000)
  lowCut?: number; // highpass filter cutoff on feedback in Hz (default 120)
  pingPong?: boolean; // stereo bouncing delay
  syncToBpm?: boolean;
}

export interface GainEffectConfig {
  gain: number; // 0.0 to 2.0 amplitude scaling (default 1.0 = 100%)
  pan?: number; // -1.0 to 1.0 stereo balance (legacy field)
}

export interface PanEffectConfig {
  pan: number; // -1.0 to 1.0 stereo balance (default 0.0)
}

export interface VelocityEffectConfig {
  multiplier: number; // 0.0 to 2.0 velocity multiplier (default 1.0 = 100%)
  offset: number; // -64 to +64 velocity offset (default 0)
  randomize?: number; // 0 to 32 velocity randomization jitter (default 0)
}

export interface EqBandConfig {
  id: string;
  type: 'lowshelf' | 'peaking' | 'highshelf' | 'notch' | 'highpass' | 'lowpass';
  frequency: number; // 20 to 20000 Hz
  gain: number; // -18 to +18 dB
  q: number; // 0.1 to 18
  enabled: boolean;
  label?: string;
}

export interface EqEffectConfig {
  bands: EqBandConfig[];
  outputGain?: number; // -12 to +12 dB
}

export interface CompressorEffectConfig {
  threshold: number; // -60 to 0 dB (default -20)
  ratio: number; // 1 to 20 (default 4)
  attack: number; // 0.001 to 0.5 sec (default 0.01 = 10ms)
  release: number; // 0.01 to 1.0 sec (default 0.15 = 150ms)
  knee: number; // 0 to 40 dB (default 5)
  makeupGain: number; // 0 to 24 dB (default 0)
  mix: number; // 0.0 to 1.0 (default 1.0)
  // Sidechain routing
  sidechainEnabled?: boolean;
  sidechainSourceId?: string | null;
  sidechainGain?: number; // 0.0 to 2.0
}

export interface MultibandBandConfig {
  threshold: number; // -60 to 0 dB
  ratio: number; // 1 to 20
  attack: number; // 0.001 to 0.5s
  release: number; // 0.01 to 1.0s
  knee?: number;
  makeupGain: number; // -12 to +18 dB
  muted?: boolean;
  solo?: boolean;
}

export interface MultibandCompressorEffectConfig {
  crossoverLow: number; // default 150 Hz
  crossoverHigh: number; // default 2500 Hz
  lowBand: MultibandBandConfig;
  midBand: MultibandBandConfig;
  highBand: MultibandBandConfig;
  outputGain: number; // 0.0 to 2.0
  mix: number; // 0.0 to 1.0
  // Multiband sidechain routing
  sidechainEnabled?: boolean;
  sidechainSourceId?: string | null;
  sidechainBands?: 'all' | 'low' | 'mid' | 'high';
}

export interface LimiterEffectConfig {
  ceiling: number; // -12 to 0 dB (default -0.1 dB)
  threshold: number; // -24 to 0 dB (default -2 dB)
  release: number; // 0.005 to 0.5 sec (default 0.05s)
  lookaheadMs?: number; // 0 to 10 ms (default 3ms)
  softClip?: boolean;
  makeupGain?: number; // 0 to 12 dB
}

export interface ReverbEffectConfig {
  decayTime: number; // 0.1 to 10.0 sec (default 2.5)
  predelay: number; // 0 to 100 ms (default 20ms)
  damping: number; // 1000 to 20000 Hz (default 6000)
  roomSize: number; // 0.1 to 1.0 (default 0.7)
  stereoWidth?: number; // 0.0 to 1.0 (default 1.0)
  wetMix: number; // 0.0 to 1.0 (default 0.4)
  dryMix: number; // 0.0 to 1.0 (default 1.0)
}

export type SaturationType = 'tape' | 'tube' | 'soft_clip' | 'hard_clip' | 'foldback';

export interface SaturationEffectConfig {
  drive: number; // 0.0 to 10.0 (default 1.5)
  saturationType: SaturationType;
  tone: number; // 500 to 16000 Hz lowpass tone filter (default 8000)
  outputGain: number; // 0.0 to 2.0 (default 1.0)
  wetMix: number; // 0.0 to 1.0 (default 1.0)
}
