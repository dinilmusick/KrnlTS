import { StoredPacket } from '@kloks/state-graph';

export interface BufferedMidiEvent {
  note: number;
  name: string;
  velocity: number;
  beat: number; // absolute master sequencer beat
  duration: number; // in beats
  cycleIndex: number;
  timestamp: number;
}

export interface BufferedAudioPeak {
  beat: number;
  peakL: number;
  peakR: number;
  cycleIndex: number;
  timestamp: number;
}

export interface BufferedCurvePoint {
  id: string;
  x: number;
  y: number;
  tension: number;
  cycleIndex: number;
  beat: number;
}

export interface RetrospectiveCycleInfo {
  bufferBeats: number;
  currentCycleIndex: number;
  beatInCurrentCycle: number;
  cycleProgress: number; // 0.0 to 1.0
  captureBoundaryBeats: number;
  captureBoundaryRatio: number;
  isAfterBoundary: boolean;
  targetedCycleIndex: number; // cycle that will be captured based on boundary
  isPreviousCycleAvailable: boolean;
  activeEventsInCurrentCycle: number;
  activeEventsInPreviousCycle: number;
}

export type SnapshotListener = (recorderId: string, packet: StoredPacket, containerId?: string) => void;
