import { MultibandCompressorEffectConfig, MultibandBandConfig } from '@kloks/state-graph';
import { initialMultibandState } from '../state_data/state';

export function updateBandParams(
  current: MultibandCompressorEffectConfig,
  band: 'lowBand' | 'midBand' | 'highBand',
  updates: Partial<MultibandBandConfig>
): MultibandCompressorEffectConfig {
  return {
    ...current,
    [band]: {
      ...current[band],
      ...updates,
    },
  };
}

export function resetMultiband(): MultibandCompressorEffectConfig {
  return JSON.parse(JSON.stringify(initialMultibandState));
}
