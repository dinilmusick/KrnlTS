import { ReverbEffectConfig } from '@kloks/state-graph';

export const initialReverbState: ReverbEffectConfig = {
  decayTime: 2.5, // 0.1 to 10s
  predelay: 20, // 0 to 100ms
  damping: 6000, // 1000 to 20000 Hz
  roomSize: 0.7, // 0.1 to 1.0
  stereoWidth: 1.0, // 0 to 1
  wetMix: 0.35, // 0 to 1
  dryMix: 1.0,
};
