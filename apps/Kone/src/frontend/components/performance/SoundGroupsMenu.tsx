'use client';

import { BaseButton, BaseSelect, TilesMenu } from '@ultrst-armada/floks/ui';
import type { PerformanceDefinition, SoundDefinition, SoundGroupDefinition } from './performanceDomain.js';
import { channelsForGroup, MAX_MIDI_CHANNELS, validateSoundGroup } from './soundGroups.js';

type Scope = 'performance' | 'song';

export function SoundGroupsMenu({
  title,
  subtitle,
  scope,
  sounds,
  groups,
  inheritedGroups = [],
  onCreateSound,
  onCreateGroup,
  onAssignSound,
}: {
  title: string;
  subtitle: string;
  scope: Scope;
  sounds: SoundDefinition[];
  groups: SoundGroupDefinition[];
  inheritedGroups?: SoundGroupDefinition[];
  onCreateSound: () => void;
  onCreateGroup: () => void;
  onAssignSound: (soundId: string, groupId: string) => void;
}) {
  const renderGroup = (group: SoundGroupDefinition, inherited: boolean) => {
    const members = channelsForGroup(group, sounds);
    const validation = validateSoundGroup(group, sounds);
    return {
      id: group.id,
      title: group.name,
      description: `${inherited ? 'Inherited · ' : ''}${members.length}/${MAX_MIDI_CHANNELS} MIDI channels · ${group.midiDeviceKey || 'No MIDI device assigned'}`,
      members,
      validation,
    };
  };
  const allGroups = [...groups.map((group) => renderGroup(group, false)), ...inheritedGroups.map((group) => renderGroup(group, true))];
  const ungrouped = sounds.filter((sound) => !allGroups.some((group) => group.members.some((entry) => entry.sound.id === sound.id)));

  return <section aria-label={`${scope} Sounds`} style={{ padding: 24, minHeight: 0, overflow: 'auto' }}>
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <BaseButton size="sm" variant="accent" onClick={onCreateGroup}>Create Sound Group</BaseButton>
      <BaseButton size="sm" variant="secondary" onClick={onCreateSound}>Create Sound</BaseButton>
    </div>
    <TilesMenu
      id={`kone-${scope}-sound-groups`}
      title={title}
      subtitle={subtitle}
      tiles={allGroups.map((group) => ({
        id: group.id,
        title: group.title,
        description: group.validation.error ?? group.description,
      }))}
      emptyText="No Sound Groups yet."
      onSelect={() => {}}
    />
    <div style={{ marginTop: 16 }}>
      <strong style={{ fontSize: 12 }}>Sounds</strong>
      {sounds.map((sound) => {
        const current = allGroups.find((group) => group.members.some((entry) => entry.sound.id === sound.id));
        return <div key={sound.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', fontSize: 11 }}>
          <span style={{ minWidth: 160 }}>{sound.name}</span>
          <BaseSelect
            aria-label={`Sound Group for ${sound.name}`}
            value={current?.id ?? ''}
            disabled={Boolean(current && inheritedGroups.some((group) => group.id === current.id))}
            options={[{ label: 'Ungrouped', value: '' }, ...groups.map((group) => ({ label: group.name, value: group.id }))]}
            onChange={(event) => onAssignSound(sound.id, event.target.value)}
          />
          {current && <span>channel {current.members.find((entry) => entry.sound.id === sound.id)?.channel ?? '—'}</span>}
        </div>;
      })}
      {ungrouped.length === 0 && sounds.length > 0 ? null : <span style={{ fontSize: 11 }}>Ungrouped Sounds use no generated MIDI output route.</span>}
    </div>
  </section>;
}
