export interface SoundLike { id: string; name: string; soundGroupId?: string; }
export interface SoundGroupLike { id: string; name: string; soundIds: string[]; midiDeviceKey: string; }

export const MAX_MIDI_CHANNELS = 16;

export function compareSounds(a: SoundLike, b: SoundLike): number {
  const name = a.name.toLocaleLowerCase('en').localeCompare(b.name.toLocaleLowerCase('en'), 'en');
  return name !== 0 ? name : a.id.localeCompare(b.id);
}

export function channelsForGroup(group: SoundGroupLike, sounds: SoundLike[]) {
  const members = group.soundIds.map((id) => sounds.find((sound) => sound.id === id)).filter((sound): sound is SoundLike => Boolean(sound)).sort(compareSounds);
  return members.map((sound, index) => ({ sound, channel: index }));
}

export function validateSoundGroup(group: SoundGroupLike, sounds: SoundLike[]) {
  const members = channelsForGroup(group, sounds);
  return {
    soundCount: members.length,
    valid: members.length <= MAX_MIDI_CHANNELS,
    error: members.length > MAX_MIDI_CHANNELS ? `Sound Group "${group.name}" contains ${members.length} Sounds; MIDI supports only 16 channels on its configured device.` : undefined,
  };
}

export function resolveSoundRoute(sound: SoundLike, group: SoundGroupLike | undefined, allSounds: SoundLike[]) {
  if (!group || !group.soundIds.includes(sound.id)) return undefined;
  const entry = channelsForGroup(group, allSounds).find((item) => item.sound.id === sound.id);
  if (!entry || entry.channel >= MAX_MIDI_CHANNELS) return undefined;
  if (!group.midiDeviceKey) return { soundId: sound.id, soundGroupId: group.id, midiDeviceKey: undefined, channel: entry.channel };
  return { soundId: sound.id, soundGroupId: group.id, midiDeviceKey: group.midiDeviceKey, channel: entry.channel };
}
