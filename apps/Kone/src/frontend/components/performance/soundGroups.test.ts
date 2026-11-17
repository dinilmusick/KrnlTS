import { describe, expect, it } from 'vitest';
import { channelsForGroup, MAX_MIDI_CHANNELS, validateSoundGroup } from './soundGroups.js';

describe('sound groups', () => {
  it('assigns deterministic case-insensitive alphabetical MIDI channels', () => {
    const sounds = [{ id: 'b', name: 'snare' }, { id: 'a', name: 'Kick' }, { id: 'c', name: 'Hi-Hat' }];
    const group = { id: 'drums', name: 'Drums', soundIds: ['b', 'a', 'c'], midiDeviceKey: 'midi-output-main' };
    expect(channelsForGroup(group, sounds).map(({ sound, channel }) => [sound.name, channel])).toEqual([['Hi-Hat', 0], ['Kick', 1], ['snare', 2]]);
  });
  it('uses stable id tie-breakers for duplicate names', () => {
    const sounds = [{ id: 'b', name: 'Kick' }, { id: 'a', name: 'kick' }];
    const group = { id: 'drums', name: 'Drums', soundIds: ['b', 'a'], midiDeviceKey: 'midi-output-main' };
    expect(channelsForGroup(group, sounds).map(({ sound }) => sound.id)).toEqual(['a', 'b']);
  });
  it('rejects a group with more than 16 sounds without overwriting channels', () => {
    const sounds = Array.from({ length: 17 }, (_, index) => ({ id: String(index), name: `Sound ${index}` }));
    const group = { id: 'too-many', name: 'Too Many', soundIds: sounds.map(sound => sound.id), midiDeviceKey: 'midi-output-main' };
    const result = validateSoundGroup(group, sounds);
    expect(result.valid).toBe(false);
    expect(result.soundCount).toBe(17);
    expect(result.error ?? '').toMatch(/16/);
    expect(channelsForGroup(group, sounds).at(-1)?.channel).toBe(16);
    expect(MAX_MIDI_CHANNELS).toBe(16);
  });
});
