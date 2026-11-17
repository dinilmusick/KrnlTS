import { CompressorEffectConfig } from '@kloks/state-graph';

export const initialCompressorState: CompressorEffectConfig = {
  threshold: -20, // -60 to 0 dB
  ratio: 4, // 1 to 20
  attack: 0.01, // 10ms
  release: 0.15, // 150ms
  knee: 5, // 0 to 40 dB
  makeupGain: 0, // 0 to 24 dB
  mix: 1.0, // 0 to 1
  sidechainEnabled: false,
  sidechainSourceId: null,
  sidechainGain: 1.0,
};
