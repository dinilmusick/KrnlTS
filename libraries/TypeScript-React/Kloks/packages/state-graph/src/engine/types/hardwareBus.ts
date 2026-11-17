// ═══════════════════════════════════════════════════════════════════
// HARDWARE BUS, QUANTIZE & AUDIO PAD TYPES
// ═══════════════════════════════════════════════════════════════════
import { AudioSampleItem, SamplePresetType, AudioTrackData } from "./audio";

export type AudioBusType = 'input' | 'output';

export interface NamedAudioBus {
  id: string;
  busType: AudioBusType;
  deviceId: string;
  name: string; // user-defined name e.g. "Main Mic", "Lead Vocal", "Master Monitors"
  channel?: number; // For input: 1 = Left/Mono, 2 = Right, 0 = Stereo, etc.
  outputChannels?: string; // For output: 'Ch 1 / 2 (Main L/R)', 'Ch 3 / 4 (Sub / Cue)', etc.
  gain: number; // 0.0 to 2.0
  isMuted: boolean;
  color?: string;
}

export type NamedAudioInput = NamedAudioBus;

export interface MidiDeviceConfig {
  id: string;
  customName?: string;
  enabled: boolean;
  channelFilter: number; // 0 = all channels, 1-16
}

export interface ConnectionsConfig {
  selectedAudioDeviceId: string;
  selectedAudioOutputDeviceId?: string;
  hardwareChannelCount?: number;
  namedAudioInputs: NamedAudioBus[];
  selectedMidiDeviceId: string | null;
  midiConfigs: Record<string, MidiDeviceConfig>;
}

export interface HardwareChannelInfo {
  id: number;
  label: string;
  shortLabel: string;
  isStereo: boolean;
  channels: number[]; // 1-indexed audio channels
}

export interface ComponentSocketConstraint {
  allowedNodeTypes: Array<'container' | 'module' | 'effect' | 'trigger' | 'combiner' | 'multiplexer'>;
  allowedContainerTypes?: Array<'audio' | 'midi' | 'curve' | 'instrument'>;
  allowedAudioFormats?: Array<'mono' | 'stereo'>;
  allowedModuleArchetypes?: string[];
  description: string;
}

export interface SampleZoneConfig {
  id: string;
  containerId?: string; // Connected Audio Container node ID
  sampleName: string;
  sampleType?: SamplePresetType | string;
  customAudioUrl?: string;
  minNote: number; // 0..127
  maxNote: number; // 0..127
  centerNote: number; // 0..127 (Root note of sample)
  startTime?: number; // start offset in seconds
  endTime?: number; // end offset in seconds
}


export type QuantizeDivision =
  | 'none'
  | '1/16'
  | '1/8'
  | '1/4'
  | '1/2'
  | '1_bar'
  | '2_bars'
  | '4_bars';

export type QuantizeStatus =
  | 'idle'
  | 'armed_waiting'
  | 'recording'
  | 'playing'
  | 'stopping_waiting';


export interface AudioPadItem {
  id: string;
  clipId?: string;
  name: string;
  containerId?: string;
  containerName?: string;
  audioFormat: 'mono' | 'stereo';
  midiNote: number;
  sampleType?: string;
  customAudioUrl?: string;
  waveformData?: number[];
  durationBeats?: number;
  gain?: number;
  pan?: number;
  audioTrack?: AudioTrackData;
}
