import { MidiInputDevice } from '@kloks/state-graph';

export interface MidiEventPayload {
  type: 'noteon' | 'noteoff' | 'cc' | 'pitchbend' | 'aftertouch' | 'programchange';
  note: number;
  noteName: string;
  velocity: number;
  channel: number;
  deviceId?: string;
  deviceName?: string;
  controller?: number;
  value?: number;
  timestamp: number;
}

export type MidiStatus = 'uninitialized' | 'requesting' | 'connected' | 'denied' | 'unsupported';
export type MidiListener = (event: MidiEventPayload) => void;
export type DeviceListener = (devices: MidiInputDevice[]) => void;
export type StatusListener = (status: MidiStatus, message: string) => void;
