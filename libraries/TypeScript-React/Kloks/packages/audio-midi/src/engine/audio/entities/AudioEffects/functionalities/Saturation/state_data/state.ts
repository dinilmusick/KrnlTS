import { SaturationEffectConfig } from '@kloks/state-graph';

export const initialSaturationState: SaturationEffectConfig = {
  drive: 1.8, // 0.1 to 10
  saturationType: 'tape', // 'tape' | 'tube' | 'soft_clip' | 'hard_clip' | 'foldback'
  tone: 8500, // 500 to 16000 Hz
  outputGain: 1.0, // 0 to 2
  wetMix: 1.0, // 0 to 1
};
