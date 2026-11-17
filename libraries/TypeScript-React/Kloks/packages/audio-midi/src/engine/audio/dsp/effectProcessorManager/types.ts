import { EffectNode } from '@kloks/state-graph';

export interface AudioEffectProcessorInstance {
  input: AudioNode;
  output: AudioNode;
  sidechainInput?: GainNode;
  updateEffect: (effect: EffectNode) => void;
  getReductionDb: () => number | { low: number; mid: number; high: number };
  dispose: () => void;
}
