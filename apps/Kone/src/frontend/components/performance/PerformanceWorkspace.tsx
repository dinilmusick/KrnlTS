'use client';

import { useState } from 'react';
import { BaseButton } from '@ultrst-armada/floks/ui';
import { PerformanceNodeGraph } from './PerformanceNodeGraph.js';
import { CodeBlocksWorkspace } from './CodeBlocksWorkspace.js';
import { SoundGroupsMenu } from './SoundGroupsMenu.js';
import { ScopedResourceMenu } from './ScopedResourceMenu.js';
import { codeBlocksFor, motifsFor } from './performanceResources.js';
import { validateSoundGroup } from './soundGroups.js';
import type { CodeBlockDefinition, MotifDefinition, PerformanceDefinition, SoundDefinition } from './performanceDomain.js';

type Tab = 'graph' | 'code' | 'motifs' | 'sounds';

export function PerformanceWorkspace({ performance, onPerformanceChange, onSongDoubleClick, onBack }: {
  performance: PerformanceDefinition;
  onPerformanceChange: (performance: PerformanceDefinition) => void;
  onSongDoubleClick: (songId: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>('graph');
  const update = (patch: Partial<PerformanceDefinition>) => onPerformanceChange({ ...performance, ...patch });
  const createCode = () => { const n = performance.codeBlocks.length + 1; update({ codeBlocks: [...performance.codeBlocks, { id: `performance-code-${n}`, name: `Code Block ${n}`, code: '// JavaScript\n', language: 'javascript' }] }); };
  const createMotif = () => { const n = performance.motifs.length + 1; update({ motifs: [...performance.motifs, { id: `performance-motif-${n}`, name: `Motif ${n}` }] }); };
  const createSound = () => { const n = performance.sounds.length + 1; update({ sounds: [...performance.sounds, { id: `performance-sound-${n}`, name: `Sound ${n}` }] }); };
  const createGroup = () => { const n = performance.soundGroups.length + 1; const id = `performance-sound-group-${n}`; update({ soundGroups: [...performance.soundGroups, { id, name: `Sound Group ${n}`, soundIds: [], midiDeviceKey: '' }] }); };
  const assignSound = (soundId: string, groupId: string) => update({ sounds: performance.sounds.map((sound) => sound.id === soundId ? { ...sound, soundGroupId: groupId || undefined } : sound), soundGroups: performance.soundGroups.map((group) => ({ ...group, soundIds: group.id === groupId ? [...new Set([...group.soundIds, soundId])] : group.soundIds.filter((id) => id !== soundId) })) });
  const updateCode = (block: CodeBlockDefinition) => update({ codeBlocks: performance.codeBlocks.map((item) => item.id === block.id ? block : item) });
  const tabs: Array<[Tab, string]> = [['graph', 'Performance Graph'], ['code', 'Code Blocks'], ['motifs', 'Motifs'], ['sounds', 'Sounds']];

  return <section aria-label={`Performance ${performance.name}`} style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
    <header style={{ minHeight: 48, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderBottom: 'var(--skipo-border)' }}>
      <BaseButton variant="secondary" size="sm" onClick={onBack}>← Performances</BaseButton>
      <strong style={{ marginRight: 12, fontSize: 12 }}>{performance.name}</strong>
      {tabs.map(([id, label]) => <BaseButton key={id} variant={tab === id ? 'accent' : 'secondary'} size="sm" onClick={() => setTab(id)}>{label}</BaseButton>)}
    </header>
    <div style={{ flex: 1, minHeight: 0 }}>
      {tab === 'graph' && <PerformanceNodeGraph songs={performance.songs} onSongDoubleClick={onSongDoubleClick} />}
      {tab === 'code' && <CodeBlocksWorkspace resources={codeBlocksFor(performance)} ownScope="performance" onCreate={createCode} onUpdate={updateCode} />}
      {tab === 'motifs' && <div style={{ padding: 24 }}><ScopedResourceMenu<MotifDefinition> title="Motifs" subtitle="Performance-scoped MIDI phrases" resources={motifsFor(performance)} ownScope="performance" onCreate={createMotif} onSelect={() => {}} /></div>}
      {tab === 'sounds' && <SoundGroupsMenu title="Sounds" subtitle="Performance sounds grouped onto configured MIDI devices and channels" scope="performance" sounds={performance.sounds} groups={performance.soundGroups} onCreateGroup={createGroup} onCreateSound={createSound} onAssignSound={assignSound} />}
      {performance.soundGroups.some((group) => validateSoundGroup(group, performance.sounds).error) && <div role="alert" style={{ padding: 8, fontSize: 11 }}>One or more Sound Groups exceed the 16-channel MIDI limit.</div>}
    </div>
  </section>;
}
