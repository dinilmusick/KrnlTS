import { DelayEffectConfig } from '@kloks/state-graph';

export const initialDelayState: DelayEffectConfig = {
  delayBeats: 0.5, // 0.25, 0.5, 0.75, 1.0, 2.0
  feedback: 0.45, // 0 to 0.95
  wetMix: 0.5, // 0 to 1
  highCut: 5500, // feedback tone dampening
  lowCut: 120, // highpass on repeats
  pingPong: true,
  syncToBpm: true,
};
