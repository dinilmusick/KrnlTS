import { LimiterEffectConfig } from '@kloks/state-graph';
import { initialLimiterState } from '../state_data/state';

export function updateLimiterParams(
  current: LimiterEffectConfig,
  updates: Partial<LimiterEffectConfig>
): LimiterEffectConfig {
  return { ...current, ...updates };
}

export function resetLimiter(): LimiterEffectConfig {
  return JSON.parse(JSON.stringify(initialLimiterState));
}
