import { createService, createServiceDefinition, type IService } from '@ultrst-armada/krnl';
import { MidiService, type MidiBackend, type MidiDevice } from './service.js';
import type { MidiMessage } from './message.js';
export interface MidiState extends Record<string, unknown> { devices: MidiDevice[]; lastMessage: MidiMessage | null; }
export function createMidiKernelService(backend: MidiBackend): IService<MidiState> {
  const midi = new MidiService(backend);
  let service: IService<MidiState> | undefined;
  let stopMessages: (() => void) | undefined;
  let stopDevices: (() => void) | undefined;
  const definition = createServiceDefinition<MidiState>({
    id: 'kloks.midi', name: 'MidiService', version: '1.0.0',
    state: { initial: { devices: [], lastMessage: null } },
    lifecycle: {
      onInit: () => {
        stopDevices = midi.subscribeDevices(devices => { if (service) service.setState({ devices }); });
        stopMessages = midi.subscribe((lastMessage) => { if (service) service.setState({ lastMessage }); });
      },
      onStop: async () => { await Promise.all(midi.getDevices().filter(device => device.origin === 'physical' && device.state === 'connected').map(device => midi.disconnect(device.id))); },
      onDispose: async () => { stopMessages?.(); stopDevices?.(); await midi.dispose(); },
    },
    operations: {
      discover: { id: 'MidiService.discover', name: 'discover', handler: async () => midi.discover() },
      createLogicalDevice: { id: 'MidiService.createLogicalDevice', name: 'createLogicalDevice', handler: async (input: { name: string; direction?: 'input'|'output'|'duplex' }) => midi.createLogicalDevice(input.name, input.direction) },
      connectInput: { id: 'MidiService.connectInput', name: 'connectInput', handler: async (input: { deviceId: string }) => midi.connectInput(input.deviceId) },
      connectOutput: { id: 'MidiService.connectOutput', name: 'connectOutput', handler: async (input: { deviceId: string }) => midi.connectOutput(input.deviceId) },
      send: { id: 'MidiService.send', name: 'send', handler: async (input: { deviceId: string; message: MidiMessage }) => midi.send(input.deviceId, input.message) },
      disconnect: { id: 'MidiService.disconnect', name: 'disconnect', handler: async (input: { deviceId: string }) => midi.disconnect(input.deviceId) },
      getCapabilities: { id: 'MidiService.getCapabilities', name: 'getCapabilities', handler: async () => midi.getCapabilities() },
    },
  });
  service = createService(definition);
  return service;
}
