import { ReverbEffectConfig } from '@kloks/state-graph';
import { initialReverbState } from '../state_data/state';

export function updateReverbParams(
  current: ReverbEffectConfig,
  updates: Partial<ReverbEffectConfig>
): ReverbEffectConfig {
  return { ...current, ...updates };
}

export function resetReverb(): ReverbEffectConfig {
  return JSON.parse(JSON.stringify(initialReverbState));
}
