import { MidiInputDevice } from "../types/index.js";

export interface NamedMidiProfile {
  id: string;
  name: string;
  sourceDeviceId: string; // ID of detected hardware or virtual device, or 'all' for Omni
  channel?: number; // 0 for Omni/All, or 1..16
  color?: string;
  enabled?: boolean;
}

const CUSTOM_NAMES_KEY = 'celestial_midi_custom_names';
const VIRTUAL_DEVS_KEY = 'celestial_midi_virtual_devices';
const NAMED_PROFILES_KEY = 'celestial_midi_named_profiles';

const DEFAULT_NAMED_MIDI_PROFILES: NamedMidiProfile[] = [
  {
    id: 'midi-profile-1',
    name: 'Main Stage Synth / Keyboard',
    sourceDeviceId: 'virtual-keyboard',
    channel: 0,
    color: '#38bdf8',
    enabled: true,
  },
  {
    id: 'midi-profile-2',
    name: 'External MIDI Controller / Pads',
    sourceDeviceId: 'all',
    channel: 1,
    color: '#f59e0b',
    enabled: true,
  },
];

export function getCustomMidiNames(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_NAMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomMidiNames(names: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(names));
}

export function getCustomMidiName(id: string): string | undefined {
  return getCustomMidiNames()[id];
}

export function setCustomMidiName(id: string, name: string): void {
  const current = getCustomMidiNames();
  if (!name.trim()) {
    delete current[id];
  } else {
    current[id] = name.trim();
  }
  saveCustomMidiNames(current);
}

export function getVirtualMidiDevices(): MidiInputDevice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VIRTUAL_DEVS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVirtualMidiDevices(devices: MidiInputDevice[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VIRTUAL_DEVS_KEY, JSON.stringify(devices));
}

export function createVirtualMidiDevice(name: string): MidiInputDevice {
  const devices = getVirtualMidiDevices();
  const newDevice: MidiInputDevice = {
    id: `virtual-midi-dev-${Date.now()}`,
    name: name.trim() || `Virtual MIDI Port ${devices.length + 1}`,
    manufacturer: 'Celestial Studio (Virtual)',
    state: 'connected',
  };
  devices.push(newDevice);
  saveVirtualMidiDevices(devices);
  return newDevice;
}

export function deleteVirtualMidiDevice(id: string): void {
  const devices = getVirtualMidiDevices();
  const filtered = devices.filter((d) => d.id !== id);
  saveVirtualMidiDevices(filtered);
}

export function getNamedMidiProfiles(): NamedMidiProfile[] {
  if (typeof window === 'undefined') return DEFAULT_NAMED_MIDI_PROFILES;
  try {
    const raw = localStorage.getItem(NAMED_PROFILES_KEY);
    if (!raw) {
      localStorage.setItem(NAMED_PROFILES_KEY, JSON.stringify(DEFAULT_NAMED_MIDI_PROFILES));
      return DEFAULT_NAMED_MIDI_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NAMED_MIDI_PROFILES;
  }
}

export function saveNamedMidiProfiles(profiles: NamedMidiProfile[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NAMED_PROFILES_KEY, JSON.stringify(profiles));
}

export function addNamedMidiProfile(profile: Omit<NamedMidiProfile, 'id'>): NamedMidiProfile {
  const profiles = getNamedMidiProfiles();
  const newProfile: NamedMidiProfile = {
    ...profile,
    id: `midi-profile-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  };
  profiles.push(newProfile);
  saveNamedMidiProfiles(profiles);
  return newProfile;
}

export function updateNamedMidiProfile(updated: NamedMidiProfile): void {
  const profiles = getNamedMidiProfiles();
  const index = profiles.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    profiles[index] = updated;
    saveNamedMidiProfiles(profiles);
  }
}

export function deleteNamedMidiProfile(id: string): void {
  const profiles = getNamedMidiProfiles();
  const filtered = profiles.filter((p) => p.id !== id);
  saveNamedMidiProfiles(filtered);
}

export function getResolvedMidiDevices(physicalDevices: MidiInputDevice[]): MidiInputDevice[] {
  const customNames = getCustomMidiNames();
  const virtualDevices = getVirtualMidiDevices();
  const namedProfiles = getNamedMidiProfiles();

  const builtInVirtualKeyboard: MidiInputDevice = {
    id: 'virtual-keyboard',
    name: 'Virtual MIDI Keyboard',
    manufacturer: 'Celestial Studio (Built-in)',
    state: 'connected',
  };

  // Convert named profiles into MidiInputDevice entries so they resolve everywhere
  const profileDevs: MidiInputDevice[] = namedProfiles.map((p) => {
    const chLabel = !p.channel || p.channel === 0 ? 'Omni' : `Ch ${p.channel}`;
    return {
      id: p.id,
      name: p.name,
      manufacturer: `Named Profile (${chLabel})`,
      state: 'connected',
    };
  });

  // Combine built-in, named profiles, physical and virtual devices, deduplicating by ID
  const rawList = [...profileDevs, builtInVirtualKeyboard, ...physicalDevices, ...virtualDevices];
  const seenIds = new Set<string>();
  const uniqueDevices: MidiInputDevice[] = [];

  for (const dev of rawList) {
    if (dev && dev.id && !seenIds.has(dev.id)) {
      seenIds.add(dev.id);
      uniqueDevices.push(dev);
    }
  }

  // Resolve custom names
  return uniqueDevices.map((dev) => ({
    ...dev,
    name: customNames[dev.id] || dev.name,
  }));
}
