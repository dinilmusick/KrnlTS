import { midiToNoteName } from '../../functions/musicTheory';
export { midiToNoteName };

export interface MidiEventPayload {
  type?: string;
  command?: string;
  note: number;
  noteName?: string;
  velocity?: number;
  channel?: number;
  timestamp?: number;
  [key: string]: any;
}

export interface DebugTraceEntry {
  category: 'AUDIO' | 'MIDI';
  stage: string;
  timestamp: number;
  data: Record<string, any>;
  assertionsPassed: boolean;
}

export interface CanonicalAudioEndpointState {
  id: string; // matches sourceId (e.g. 'bus-in-1', 'audio-input-1')
  name: string;
  channel: number;
  gain: number;
  isMuted: boolean;
  connected: boolean;
  level: number; // 0.0 to 1.0 (derived from f(audioBuffer))
  peak: number;
  rms: number;
  sampleCount: number;
  noiseFloor: number;
}

export interface CanonicalMidiEndpointState {
  id: string; // matches sourceId (e.g. 'midi-profile-1', 'input-0', 'virtual-keyboard', 'all')
  name: string;
  connected: boolean;
  active: boolean;
  currentNote: number | null;
  currentNoteName: string | null;
  velocity: number;
  activeNotes: Set<number>;
  lastEventTimestamp: number;
}

/**
 * Calculates audio meter level according to canonical formula:
 * peak := max(|sample|)
 * rms := sqrt(mean(sample²))
 * meterLevel := weightedBlend(peak, rms)
 */
export function calculateAudioMeterLevel(peak: number, rms: number, gain = 1.0): number {
  if (peak <= 0.0005 && rms <= 0.0005) {
    return 0.0;
  }
  const raw = peak * 0.75 + rms * 0.25;
  return Math.min(1.0, Math.max(0.0, raw * 1.5 * gain));
}
