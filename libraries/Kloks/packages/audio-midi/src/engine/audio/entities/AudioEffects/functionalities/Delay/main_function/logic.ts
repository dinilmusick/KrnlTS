import { DelayEffectConfig } from '@kloks/state-graph';
import { initialDelayState } from '../state_data/state';

export function updateDelayParams(
  current: DelayEffectConfig,
  updates: Partial<DelayEffectConfig>
): DelayEffectConfig {
  return { ...current, ...updates };
}

export function resetDelay(): DelayEffectConfig {
  return JSON.parse(JSON.stringify(initialDelayState));
}
