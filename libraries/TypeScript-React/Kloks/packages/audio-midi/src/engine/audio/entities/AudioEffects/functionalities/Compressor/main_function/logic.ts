import { CompressorEffectConfig } from '@kloks/state-graph';
import { initialCompressorState } from '../state_data/state';

export function updateCompressorParams(
  current: CompressorEffectConfig,
  updates: Partial<CompressorEffectConfig>
): CompressorEffectConfig {
  return { ...current, ...updates };
}

export function resetCompressor(): CompressorEffectConfig {
  return JSON.parse(JSON.stringify(initialCompressorState));
}
