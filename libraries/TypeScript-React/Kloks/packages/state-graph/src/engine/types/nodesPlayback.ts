// ═══════════════════════════════════════════════════════════════════
// RECORDER, PLAYER & SAMPLER SPACE NODES
// ═══════════════════════════════════════════════════════════════════
import { AudioTrackData, SamplePresetType, AssetPoolScope, SynthPreset } from "./audio";
import { QuantizeDivision, QuantizeStatus, SampleZoneConfig, AudioPadItem } from "./hardwareBus";
import { UniversalSocketDefinition, CurveTrackData } from "./signals";

export type RecorderType = 'audio' | 'audio_mono' | 'audio_stereo' | 'midi' | 'curve';

export type RecordingMode = 'standard' | 'retrospective';
export type BufferLengthType = 'bars_beats' | 'time_seconds';

export type PlayerType = 'audio' | 'audio_mono' | 'audio_stereo' | 'midi' | 'curve';

export interface RecorderNode {
  id: string;
  type: 'recorder';
  recorderType: RecorderType;
  recordingMode?: RecordingMode; // 'standard' (punch-in) or 'retrospective' (continuous rolling buffer capture)
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  isRecording?: boolean;
  isArmed?: boolean;
  armMode?: 'auto' | 'manual' | 'quantized';
  quantizeEnabled?: boolean;
  quantizeDivision?: QuantizeDivision;
  quantizeStatus?: QuantizeStatus;
  pendingTriggerBeat?: number | null;
  pendingAction?: 'start_record' | 'stop_record' | null;
  recordingStartBeat?: number;
  targetPacketName?: string;
  recordingLengthBeats?: number;
  autoStoreOnStop?: boolean;
  currentDurationBeats?: number;
  recordedPacketsCount?: number;
  gain?: number;
  silenceThreshold?: number;
  targetContainerId?: string;
  isClipping?: boolean;
  lastTransferredAt?: number;
  // Retrospective Buffer Configuration (derived entirely from Bars, Beats, Beat Fractions: 1 beat = 64 fractions)
  bufferBars?: number; // e.g. 1, 2, 4, 6, 8 bars (default 4)
  bufferBeatsPart?: number; // 0..3 beats (default 0)
  bufferBeatFractions?: number; // 0..63 fractions (default 0)
  captureBoundaryRatio?: number; // 0..1 boundary marker position around the ring (default 0.33 or bar 2 / buffer)
  captureBoundaryBeats?: number; // threshold beat within cycle
  bufferLengthType?: BufferLengthType; // 'bars_beats' (mandatory musical clock)
  bufferLengthBars?: number; // backwards compatibility
  bufferLengthBeats?: number; // total beats computed from bars + beats + fractions/64
  bufferLengthSeconds?: number;
  captureToleranceBeatsBefore?: number;
  captureToleranceBeatsAfter?: number;
  lastCapturedTakeBeat?: number;
  lastCapturedPacketId?: string;
}

export interface PlayerNode {
  id: string;
  type: 'player';
  playerType: PlayerType;
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  isPlaying?: boolean;
  isLooping?: boolean;
  playheadBeats?: number;
  volume?: number;
  gain?: number;
  playbackSpeed?: number;
  playbackMode?: 'forward' | 'reverse' | 'ping_pong' | 'oneshot' | 'loop';
  pitchShiftSemitones?: number;
  loopLengthBeats?: number;
  quantizeEnabled?: boolean;
  quantizeDivision?: QuantizeDivision;
  quantizeStatus?: QuantizeStatus;
  pendingTriggerBeat?: number | null;
  pendingAction?: 'start_play' | 'stop_play' | null;
  playbackStartBeat?: number;
  synthPreset?: SynthPreset;
  sampleZones?: SampleZoneConfig[];
}

export interface SamplerNode {
  id: string;
  type: 'sampler';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  isPlaying?: boolean;
  volume?: number;
  rootKey?: number;
  glide?: number;
  polyphony?: number;
  zones?: any[];
  sampleZones?: SampleZoneConfig[];
  synthPreset?: SynthPreset;
}

export interface AudioPadsNode {
  id: string;
  type: 'audio_pads';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  pads?: AudioPadItem[];
  padMidiMap?: Record<string, number>;
  selectedPadId?: string;
  volume?: number;
}