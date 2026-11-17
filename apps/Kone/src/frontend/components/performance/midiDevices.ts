import { MidiService, createWebMidiBackend, type MidiMessage, type MidiDevice } from '@ultrst-armada/kloks/midi';

let service: MidiService | undefined;

export function getKoneMidiService(): MidiService {
  if (!service) service = new MidiService(createWebMidiBackend());
  return service;
}

export function getStoredMidiDeviceKeys(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('kone.midi-device-keys') ?? '[]') as string[]; }
  catch { return []; }
}

export function storeMidiDeviceKeys(keys: string[]): void {
  if (typeof window !== 'undefined') localStorage.setItem('kone.midi-device-keys', JSON.stringify([...new Set(keys)]));
}

export function subscribeMidiDevices(listener: (devices: MidiDevice[]) => void): () => void {
  return getKoneMidiService().subscribeDevices(listener);
}

export async function discoverMidiDevices(): Promise<MidiDevice[]> {
  const midi = getKoneMidiService();
  await midi.discover();
  const devices = midi.getDevices();
  storeMidiDeviceKeys(devices.filter((device) => device.origin === 'physical').map((device) => device.id));
  return devices;
}

export async function sendMidi(deviceId: string, message: MidiMessage): Promise<void> {
  return getKoneMidiService().send(deviceId, message);
}
