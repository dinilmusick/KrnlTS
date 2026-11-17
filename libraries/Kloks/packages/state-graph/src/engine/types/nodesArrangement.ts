// ═══════════════════════════════════════════════════════════════════
// ARRANGEMENT TIMELINE NODES
// ═══════════════════════════════════════════════════════════════════
import {
  AudioTrackData,
  MidiPattern,
  MidiNote,
  TriggerPulse,
  TriggerPacketData,
} from "./audio";
import { UniversalSocketDefinition } from "./signals";
import { CurveTrackData } from "./sceneData";

export type ArrangementSignalType = 'audio' | 'audio_mono' | 'audio_stereo' | 'midi' | 'trigger' | 'trigger_stream' | 'trigger_packet' | 'curve';

export interface ArrangementClip {
  id: string;
  name: string;
  containerId?: string;
  signalType: ArrangementSignalType;
  startBeat: number;
  durationBeats: number;
  offsetBeats?: number;
  color?: string;
  audioTrack?: AudioTrackData;
  waveformData?: number[];
  sampleType?: string;
  customAudioUrl?: string;
  audioFormat?: 'mono' | 'stereo';
  pattern?: MidiPattern;
  notes?: MidiNote[];
  triggerPulses?: TriggerPulse[];
  triggerPacket?: TriggerPacketData;
  activeSteps?: boolean[];
  stepCount?: number;
  curveData?: CurveTrackData;
}

export interface ArrangementTrack {
  id: string;
  name: string;
  signalType: ArrangementSignalType;
  color: string;
  isMuted?: boolean;
  isSolo?: boolean;
  volume?: number;
  pan?: number;
  clips: ArrangementClip[];
}

export interface ArrangementNode {
  id: string;
  type: 'arrangement';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  width: number;
  height: number;
  tracks: ArrangementTrack[];
  totalBars: number;
  timeSignature: [number, number];
  currentBeat: number;
  isPlaying?: boolean;
  isLooping?: boolean;
  loopStartBeat?: number;
  loopEndBeat?: number;
  snapSetting?: 'bar' | '1/2' | '1/4' | '1/8' | 'free';
  zoom?: number;
  socketOffsets?: Record<string, { x: number; y: number }>;
}
