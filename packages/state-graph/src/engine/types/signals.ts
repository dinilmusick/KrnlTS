// ═══════════════════════════════════════════════════════════════════
// SIGNAL ROUTING & WIRE PROTOCOL TYPES
// ═══════════════════════════════════════════════════════════════════
import {
  MidiNote,
  TriggerPulse,
  TriggerPacketData,
  AudioTrackData,
  MidiPattern,
  SamplePresetType,
} from "./audio";
import { CurveTrackData } from "./sceneData";
export type { CurveTrackData };

export type TriggerDivisionMode =
  | 'every_bar'
  | 'every_beat'
  | 'divisions'
  | 'selected_beats'
  | '4_4'
  | '2_4'
  | '16th'
  | '32nd'
  | '64th'
  | 'custom';

export type TriggerType = 'beats' | 'beat_fractions' | 'euclidean' | 'random';

export type SignalMedium =
  | 'audio_stereo'
  | 'audio_mono'
  | 'midi'
  | 'curve'
  | 'trigger'
  | 'component'
  | 'omni'
  | 'data';

export type SignalDataType = 'stream' | 'packet' | 'pulse';

export type SignalPolarity = 'input' | 'output';

export type ConnectivityType = 'single' | 'multi';

export type SignalType =
  | 'trigger'
  | 'trigger_stream'
  | 'trigger_packet'
  | 'audio_stream'
  | 'audio_packet'
  | 'midi_stream'
  | 'midi_packet'
  | 'curve_stream'
  | 'curve_packet'
  | 'omni_packet'
  | 'omni_stream'
  | 'omni'
  | 'audio'
  | 'audio_mono'
  | 'audio_stereo'
  | 'midi'
  | 'curve'
  | 'component'
  | 'effect'
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array';

export type SignalFormat = 'packet' | 'stream' | 'pulse';

export interface UniversalSocketDefinition {
  socketId: string;
  label: string;
  polarity: SignalPolarity;
  medium: SignalMedium;
  dataType: SignalDataType;
  signalType: SignalType;
  connectivity: ConnectivityType;
  socketIndex: number;
  description: string;
  colorHex?: number;
  colorStr?: string;
  bgStr?: string;
  iconName?: string;
  isCustom?: boolean;
  isOmni?: boolean;
  customMeta?: Record<string, any>;
}

export type NodeSocketDescriptor = UniversalSocketDefinition;

export interface StoredPacket {
  id: string;
  index: number;
  name: string;
  type: 'audio' | 'midi' | 'curve' | 'trigger';
  createdAt: number;
  durationBeats?: number;
  signalFormat?: SignalFormat;
  signalType?: SignalType;
  audioTrack?: AudioTrackData;
  pattern?: MidiPattern;
  curveData?: CurveTrackData;
  triggerPacket?: TriggerPacketData;
  sampleType?: SamplePresetType | string;
  customAudioUrl?: string;
  audioFormat?: 'mono' | 'stereo';
  waveformData?: number[];
  gain?: number;
  pan?: number;
  pitchShift?: number;
  filterCutoff?: number;
  fadeInBeats?: number;
  fadeOutBeats?: number;
  trimStartBeats?: number;
  trimEndBeats?: number;
  isReversed?: boolean;
}


export type SignalKind = 'all' | 'trigger' | 'trigger_stream' | 'trigger_packet' | 'midi' | 'audio' | 'audio_mono' | 'audio_stereo' | 'curve' | 'component';


export interface WireSignalPayload {
  type: SignalType;
  timestamp: number;
  midiNote?: {
    note: number;
    name: string;
    velocity: number;
    duration: number;
  };
  audioSpec?: {
    sampleName?: string;
    sampleRate: number;
    channels: number;
    gain: number;
    durationBeats: number;
    format: string;
  };
  triggerSpec?: {
    pulseIntensity: number;
    division?: string;
    sourceName?: string;
    pulse?: TriggerPulse;
  };
  curveSpec?: {
    targetParam: string;
    value: number;
    normalizedValue: number;
  };
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort?: string;
  fromSocketId?: string;
  fromSocketIndex?: number;
  toPort?: 'record' | 'capture' | 'play_stop' | 'play_pause' | string;
  toSocketId?: string;
  toSocketIndex?: number;
  signalType?: SignalType; // Canonical signal protocol traveling along this wire
  signalMedium?: SignalMedium;
  signalDataType?: SignalDataType;
  latencyBeats: number;
  lastPulseTime?: number;
  lastSignalPayload?: WireSignalPayload;
  effectOrder?: string[]; // IDs of effects arranged in execution precedence
  affectedByEffectIds?: string[]; // IDs of effect spheres currently enveloping this wire
  dryMix?: number; // 0.0 to 1.0 (default 1.0)
  wetMix?: number; // 0.0 to 1.0 (default 1.0)
  signalGain?: number; // 0.0 to 2.0 (default 1.0)
  controlPoint?: [number, number, number]; // Draggable middle signboard control point coordinate
  isLocked?: boolean;
}

export type UniversalWire = NodeConnection;
