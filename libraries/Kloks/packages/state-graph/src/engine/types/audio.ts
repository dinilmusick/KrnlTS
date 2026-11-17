// ═══════════════════════════════════════════════════════════════════
// AUDIO SYNTHESIS & ASSET POOL TYPES
// ═══════════════════════════════════════════════════════════════════

export type SynthType = 'poly' | 'bass' | 'lead' | 'pad' | 'plucked' | 'drums';

export interface MidiNote {
  note: number; // 0-127 MIDI pitch (e.g. 60 = C4)
  name: string; // e.g. "C4"
  velocity: number; // 0.0 to 1.0
  time: number; // position in beats relative to pattern start (0 to patternLength)
  duration: number; // duration in beats
}

export interface SynthPreset {
  synthType: SynthType;
  attack: number; // seconds (0.005 - 2.0)
  decay: number; // seconds (0.05 - 2.0)
  sustain: number; // level (0.0 - 1.0)
  release: number; // seconds (0.05 - 4.0)
  cutoff: number; // Hz (100 - 16000)
  resonance: number; // Q factor (0.1 - 20)
  reverb: number; // wet mix (0.0 - 1.0)
  delay: number; // wet mix (0.0 - 1.0)
}

export interface MidiPattern {
  id: string;
  name: string;
  lengthInBeats: number; // e.g. 4, 8, 16
  tempo: number;
  notes: MidiNote[];
}

/**
 * Fundamental Trigger Pulse Data Packet (Analogous to MIDI Note)
 * Carries timing in bars, beats, and beat fractions with an optional custom code payload.
 */
export interface TriggerPulse {
  id: string;
  bar: number; // 0-indexed or 1-indexed bar number
  beat: number; // beat within bar (0, 1, 2, 3...)
  beatFraction: number; // fraction within beat (0, 1, 2, 3... for subdivisions or fractional)
  totalBeat?: number; // continuous absolute beat time across DAW timeline
  intensity: number; // 0.0 to 1.0 (analogous to strike velocity / amplitude)
  duration: number; // gate length in beats or beat fractions (e.g. 0.25)
  division?: string; // timing division, e.g. "every_bar", "every_beat", "divisions", "16th"
  codePayload?: string; // custom standard JavaScript code payload stored in pulse
  payloadData?: any; // arbitrary runtime structured payload
  executedResult?: any; // evaluation result from code execution
  sourceNodeId?: string;
  timestamp?: number;
}

/**
 * Trigger Packet (Similar to MIDI Clip)
 * A discrete series of trigger pulses placed across a defined quantity of time
 * in terms of bars, beats, and beat fractions (not in seconds or minutes).
 */
export interface TriggerPacketData {
  id: string;
  name: string;
  totalBars: number; // defined quantity of time in bars
  beatsPerBar: number; // beats per bar (e.g. 4)
  divisionsPerBeat: number; // beat subdivisions per beat (e.g. 4 for 16ths, 8 for 32nds)
  pulses: TriggerPulse[];
}

export type SamplePresetType =
  | 'ambient_drone'
  | 'pulsar_synth'
  | 'cosmic_warp'
  | 'starlight_vox'
  | 'cyber_808'
  | 'space_percussion'
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'shaker'
  | 'adlib'
  | 'vocal'
  | '808'
  | 'chime'
  | 'custom'
  | (string & {});

export interface AudioTrackData {
  id: string;
  name: string;
  sampleType: SamplePresetType | string;
  durationBeats: number;
  gain: number; // 0.0 to 2.0
  pan: number; // -1.0 to 1.0
  pitchShift: number; // -24 to +24 semitones
  filterCutoff: number; // 100 to 16000 Hz
  fadeInBeats: number;
  fadeOutBeats: number;
  trimStartBeats: number;
  trimEndBeats: number;
  isReversed: boolean;
  waveformData?: number[]; // pre-computed waveform peak heights (0.0 - 1.0)
  customAudioUrl?: string;
  sampleScope?: 'global' | 'project' | 'preset' | 'custom';
  sampleFilename?: string;
}

export interface AudioSampleItem {
  filename: string;
  name: string;
  category: string;
  format: string;
  url: string;
  size: number;
  scope: 'global' | 'project';
  projectId?: string;
  createdAt?: number;
}

export type AssetDataType = 'audio' | 'midi';
export type AssetChannelType = 'stereo' | 'mono';
export type AssetPoolScope = 'workspace' | 'project';

export interface AssetFolderInfo {
  name: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  fileCount: number;
  isSystemDefault?: boolean;
}

export interface AssetPoolItem {
  id: string;
  filename: string;
  name: string;
  scope: AssetPoolScope;
  projectId?: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  subfolder: string;
  relativePath: string;
  url: string;
  size: number;
  format: string;
  createdAt: number;
}
