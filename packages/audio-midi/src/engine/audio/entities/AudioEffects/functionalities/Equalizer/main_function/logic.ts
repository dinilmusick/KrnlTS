import { EqEffectConfig, EqBandConfig } from '@kloks/state-graph';
import { initialEqState } from '../state_data/state';

export function updateEqBand(
  current: EqEffectConfig,
  bandId: string,
  updates: Partial<EqBandConfig>
): EqEffectConfig {
  const bands = current.bands.map((b) => (b.id === bandId ? { ...b, ...updates } : b));
  return { ...current, bands };
}

export function resetEq(): EqEffectConfig {
  return JSON.parse(JSON.stringify(initialEqState));
}
