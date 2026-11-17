import { MapChannelConfig, MapIoConfig } from './legacyTypes';
import { CanonicalMidiEndpointState } from '../core/canonicalIo/topLevelIoRegistry';

export interface MonitoredSignalState {
  audioLevels: Record<string, number>; // endpointId / sourceId -> level (0.0 to 1.0)
  midiActivity: Record<string, CanonicalMidiEndpointState>; // endpointId / sourceId -> canonical MIDI state
  oscActivity: Record<string, { address?: string; argSummary?: string; timestamp: number }>;
}

export function createDefaultMapIoConfig(): MapIoConfig {
  return {
    inputs: [
      {
        id: 'map-in-audio-bus-in-1',
        sourceId: 'bus-in-1',
        name: 'Physical Audio In 1',
        type: 'audio',
        direction: 'input',
        enabled: true,
        gain: 1.0,
        color: '#f59e0b',
        audioFormat: 'mono',
        signalType: 'audio_mono',
        ioLevel: 'physical',
        portType: 'external_endpoint',
      },
      {
        id: 'map-in-midi-profile-1',
        sourceId: 'midi-profile-1',
        name: 'Physical MIDI In (Main Stage)',
        type: 'midi',
        direction: 'input',
        enabled: true,
        color: '#38bdf8',
        signalType: 'midi_stream',
        ioLevel: 'physical',
        portType: 'external_endpoint',
      },
    ],
    outputs: [
      {
        id: 'map-out-audio-master',
        sourceId: 'bus-out-master',
        name: 'Master Output L/R',
        type: 'audio',
        direction: 'output',
        enabled: true,
        gain: 1.0,
        color: '#10b981',
        audioFormat: 'stereo',
        signalType: 'audio_stereo',
        ioLevel: 'physical',
        portType: 'external_endpoint',
      },
    ],
  };
}
