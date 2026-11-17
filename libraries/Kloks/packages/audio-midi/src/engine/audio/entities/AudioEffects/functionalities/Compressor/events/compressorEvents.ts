export interface CompressorParamChangedEvent {
  param: string;
  value: number | boolean | string | null;
}

export const COMPRESSOR_EVENTS = {
  PARAM_CHANGED: 'compressor:param_changed',
  SIDECHAIN_TOGGLED: 'compressor:sidechain_toggled',
  SIDECHAIN_SOURCE_CHANGED: 'compressor:sidechain_source_changed',
  GAIN_REDUCTION: 'compressor:gain_reduction',
} as const;
