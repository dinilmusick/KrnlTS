import { LimiterEffectConfig } from '@kloks/state-graph';

export const initialLimiterState: LimiterEffectConfig = {
  ceiling: -0.1, // -12 to 0 dB
  threshold: -2.0, // -24 to 0 dB
  release: 0.05, // 0.005 to 0.5s
  lookaheadMs: 3, // 0 to 10ms
  softClip: true,
  makeupGain: 0,
};
