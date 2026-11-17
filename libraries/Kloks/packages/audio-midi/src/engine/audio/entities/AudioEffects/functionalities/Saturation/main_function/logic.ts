import { SaturationEffectConfig } from '@kloks/state-graph';
import { initialSaturationState } from '../state_data/state';

export function updateSaturationParams(
  current: SaturationEffectConfig,
  updates: Partial<SaturationEffectConfig>
): SaturationEffectConfig {
  return { ...current, ...updates };
}

export function resetSaturation(): SaturationEffectConfig {
  return JSON.parse(JSON.stringify(initialSaturationState));
}
