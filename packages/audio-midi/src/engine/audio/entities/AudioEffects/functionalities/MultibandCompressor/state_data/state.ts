import { MultibandCompressorEffectConfig } from '@kloks/state-graph';

export const initialMultibandState: MultibandCompressorEffectConfig = {
  crossoverLow: 150, // 20 - 500 Hz
  crossoverHigh: 2500, // 1000 - 12000 Hz
  lowBand: {
    threshold: -22,
    ratio: 3.5,
    attack: 0.02,
    release: 0.18,
    makeupGain: 0,
    muted: false,
    solo: false,
  },
  midBand: {
    threshold: -18,
    ratio: 2.5,
    attack: 0.015,
    release: 0.12,
    makeupGain: 0,
    muted: false,
    solo: false,
  },
  highBand: {
    threshold: -16,
    ratio: 2.0,
    attack: 0.008,
    release: 0.08,
    makeupGain: 0,
    muted: false,
    solo: false,
  },
  outputGain: 1.0,
  mix: 1.0,
  sidechainEnabled: false,
  sidechainSourceId: null,
  sidechainBands: 'all', // 'all' | 'low' | 'mid' | 'high'
};
