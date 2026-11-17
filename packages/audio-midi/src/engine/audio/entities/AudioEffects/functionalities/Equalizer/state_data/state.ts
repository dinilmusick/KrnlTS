import { EqEffectConfig, EqBandConfig } from '@kloks/state-graph';

export const DEFAULT_EQ_BANDS: EqBandConfig[] = [
  { id: 'b1', type: 'lowshelf', frequency: 100, gain: 0, q: 0.7, enabled: true, label: 'LOW' },
  { id: 'b2', type: 'peaking', frequency: 450, gain: 0, q: 1.0, enabled: true, label: 'L-MID' },
  { id: 'b3', type: 'peaking', frequency: 2200, gain: 0, q: 1.0, enabled: true, label: 'H-MID' },
  { id: 'b4', type: 'highshelf', frequency: 8000, gain: 0, q: 0.7, enabled: true, label: 'HIGH' },
];

export const initialEqState: EqEffectConfig = {
  bands: DEFAULT_EQ_BANDS,
  outputGain: 0,
};
