import { NamedAudioBus } from '@kloks/state-graph';
import { AudioDeviceInfo } from '@kloks/state-graph';
import { OutputChannelInfo } from '../deviceProfiles';

export type { AudioDeviceInfo, OutputChannelInfo };

export const DEFAULT_NAMED_BUSSES: NamedAudioBus[] = [
  {
    id: 'bus-in-1',
    busType: 'input',
    deviceId: 'default',
    name: 'Main Mic / Line In 1',
    channel: 1,
    gain: 1.0,
    isMuted: false,
    color: '#f59e0b',
  },
  {
    id: 'bus-in-2',
    busType: 'input',
    deviceId: 'default',
    name: 'Instrument / Line In 2',
    channel: 2,
    gain: 1.0,
    isMuted: false,
    color: '#06b6d4',
  },
  {
    id: 'bus-out-1',
    busType: 'output',
    deviceId: 'default',
    name: 'Main Monitors Out L/R',
    outputChannels: 'Ch 1 / 2 (Main L/R)',
    gain: 1.0,
    isMuted: false,
    color: '#10b981',
  },
];
