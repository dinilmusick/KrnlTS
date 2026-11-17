export interface EqBandChangedEvent {
  bandId: string;
  frequency: number;
  gain: number;
  q: number;
  enabled: boolean;
}

export const EQ_EVENTS = {
  BAND_CHANGED: 'eq:band_changed',
  OUTPUT_GAIN_CHANGED: 'eq:output_gain_changed',
  RESET: 'eq:reset',
} as const;
