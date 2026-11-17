'use client';

import { useEffect, useMemo, useState } from 'react';
import { CodeBlocksWorkspace } from './CodeBlocksWorkspace.js';
import { ScopedResourceMenu } from './ScopedResourceMenu.js';
import { SoundGroupsMenu } from './SoundGroupsMenu.js';
import { MidiInputControls } from './MidiInputControls.js';
import { ExecutionControls } from './ExecutionControls.js';
import { createKoneTransport } from './transport.js';
import { codeBlocksFor, motifsFor } from './performanceResources.js';
import { useKoneGraphState } from './graphState.js';
import { BaseButton, TilesMenu } from '@ultrst-armada/floks/ui';
import { FrnlEditableNodeGraph } from '@ultrst-armada/floks/canvas-ui';
import type { GraphEdge } from '@ultrst-armada/kloks/state-graph';
import { EXECUTION_FLOW, midiInputNode, multiplexerNode, multiplexerOutput, sectionNode, selectorNode, selectorOutput, socket } from './executionFlowGraph.js';
import { createSectionDefinition, type CodeBlockDefinition, type MotifDefinition, type PerformanceDefinition, type SongDefinition } from './performanceDomain.js';

function createSongGraph(song: SongDefinition) {
  const sections = song.sections.map((section, index) => sectionNode(`section-node-${section.id}`, section.name, 820, 70 + index * 150, section.duration));
  const selector = selectorNode('song-selector', 420, 120, Math.max(1, song.sections.length), 'Song');
  const multiplexer = multiplexerNode('song-multiplexer', 420, 360, Math.max(2, song.sections.length), 'Song');
  const edges: GraphEdge[] = song.sections.map((section, index) => ({ id: `edge-song-selector-${section.id}`, source: 'song-selector', sourceSocket: selectorOutput(index), target: `section-node-${section.id}`, targetSocket: 'execution-in', locked: true }));
  return { nodes: [selector, multiplexer, ...sections], edges };
}

export function SongGraphWorkspace({ performance, song, onBack, onSectionDoubleClick, onSongChange }: {
  performance: PerformanceDefinition; song: SongDefinition; onBack: () => void; onSectionDoubleClick: (sectionId: string) => void; onSongChange: (song: SongDefinition) => void;
}) {
  const [tab, setTab] = useState<Tab>('graph');
  const initialGraph = useMemo(() => createSongGraph(song), [song]);
  const graph = useKoneGraphState(initialGraph.nodes, initialGraph.edges);
  const transport = useMemo(() => createKoneTransport({ tempo: 120, resolution: 64, timeSignature: [4, 4] }), [song.id]);
  useEffect(() => () => transport.dispose(), [transport]);
  const selector = graph.nodes.find((node) => node.id === 'song-selector');
  const multiplexer = graph.nodes.find((node) => node.id === 'song-multiplexer');
  const selectorCount = selector?.outputs?.length ?? 1;
  const multiplexerCount = multiplexer?.outputs?.length ?? 2;

  const createMotif = () => onSongChange({ ...song, motifs: [...song.motifs, { id: `song-motif-${song.motifs.length + 1}`, name: `Motif ${song.motifs.length + 1}` }] });
  const createCode = () => onSongChange({ ...song, codeBlocks: [...song.codeBlocks, { id: `song-code-${song.codeBlocks.length + 1}`, name: `Code Block ${song.codeBlocks.length + 1}`, code: '// JavaScript\\n', language: 'javascript' }] });
  const updateCode = (block: CodeBlockDefinition) => onSongChange({ ...song, codeBlocks: song.codeBlocks.map((item) => item.id === block.id ? block : item) });
  const createSound = () => { const n = song.sounds.length + 1; onSongChange({ ...song, sounds: [...song.sounds, { id: `song-sound-${n}`, name: `Sound ${n}` }] }); };
  const createGroup = () => { const n = song.soundGroups.length + 1; const id = `song-sound-group-${n}`; onSongChange({ ...song, soundGroups: [...song.soundGroups, { id, name: `Sound Group ${n}`, soundIds: [], midiDeviceKey: '' }] }); };
  const assignSound = (soundId: string, groupId: string) => onSongChange({
    ...song,
    sounds: song.sounds.map((sound) => sound.id === soundId ? { ...sound, soundGroupId: groupId || undefined } : sound),
    soundGroups: song.soundGroups.map((group) => ({ ...group, soundIds: group.id === groupId ? [...new Set([...group.soundIds, soundId])] : group.soundIds.filter((id) => id !== soundId) })),
  });
  const addSection = () => {
    const next = song.sections.length + 1;
    const section = createSectionDefinition(`section-${next}`, `Section ${next}`, song.instruments);
    const node = sectionNode(`section-node-${section.id}`, section.name, 820, 70 + (next - 1) * 150, section.duration);
    graph.addNode(node);
    graph.updateNode('song-selector', { outputs: Array.from({ length: next }, (_, index) => socket(selectorOutput(index), `Execution ${index + 1}`, 'output', EXECUTION_FLOW)) });
    graph.addEdge({ id: `edge-song-selector-${section.id}`, source: 'song-selector', sourceSocket: selectorOutput(next - 1), target: node.id, targetSocket: 'execution-in', locked: true });
    onSongChange({ ...song, sections: [...song.sections, section] });
  };
  const setSelectorCount = (count: number) => {
    const next = Math.max(1, Math.min(16, count));
    graph.updateNode('song-selector', { outputs: Array.from({ length: next }, (_, index) => socket(selectorOutput(index), `Execution ${index + 1}`, 'output', EXECUTION_FLOW)) });
    graph.setEdges((edges) => edges.filter((edge) => edge.source !== 'song-selector' || Number(edge.sourceSocket.replace('execution-out-', '')) < next));
  };
  const setMultiplexerCount = (count: number) => graph.updateNode('song-multiplexer', { outputs: Array.from({ length: Math.max(1, Math.min(16, count)) }, (_, index) => socket(multiplexerOutput(index), `Execution ${index + 1}`, 'output', EXECUTION_FLOW)) });
  const addMidiInput = (deviceId: string, channel: number) => graph.addNode(midiInputNode(`midi-input-${graph.nodes.filter((node) => node.type === 'midi-input').length + 1}`, 'MIDI Input', 60, 520, deviceId, channel));

  const tabs: Array<[Tab, string]> = [['graph', 'Song Graph'], ['sounds', 'Sounds'], ['sections', 'Sections'], ['motifs', 'Motifs'], ['code', 'Code Blocks']];
  return <section aria-label={`Song ${song.name}`} style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
    <header style={{ minHeight: 48, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderBottom: 'var(--skipo-border)' }}>
      <BaseButton variant="secondary" size="sm" onClick={onBack}>← Performance</BaseButton>
      <strong style={{ marginRight: 12, fontSize: 12 }}>{song.name}</strong>
      {tabs.map(([id, label]) => <BaseButton key={id} variant={tab === id ? 'accent' : 'secondary'} size="sm" onClick={() => setTab(id)}>{label}</BaseButton>)}
    </header>
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      {tab === 'graph' && <section aria-label="Song Flow Graph" style={{ height: '100%', minHeight: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 80, display: 'flex', gap: 8, alignItems: 'center', padding: 6, border: 'var(--skipo-border)', borderRadius: 'var(--skipo-radius)', background: 'var(--skipo-surface)', fontSize: 11 }}>
          <span>Selector {selectorCount}</span><BaseButton variant="secondary" size="sm" disabled={selectorCount <= 1} onClick={() => setSelectorCount(selectorCount - 1)}>−</BaseButton><BaseButton variant="secondary" size="sm" disabled={selectorCount >= 16} onClick={() => setSelectorCount(selectorCount + 1)}>+</BaseButton>
          <span>Multiplexer {multiplexerCount}</span><BaseButton variant="secondary" size="sm" disabled={multiplexerCount <= 1} onClick={() => setMultiplexerCount(multiplexerCount - 1)}>−</BaseButton><BaseButton variant="secondary" size="sm" disabled={multiplexerCount >= 16} onClick={() => setMultiplexerCount(multiplexerCount + 1)}>+</BaseButton>
          <MidiInputControls onAdd={addMidiInput} />
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 80 }}><ExecutionControls graphId={`song-${song.id}`} nodes={graph.nodes} edges={graph.edges} entryNodeIds={['song-selector']} transport={transport}/></div>
        <FrnlEditableNodeGraph id="song-flow-node-graph" nodes={graph.nodes} edges={graph.edges} viewport={graph.viewport} selectedNodeIds={graph.selectedNodeIds} onNodesChange={(nodes) => graph.setNodes(nodes as any)} onEdgesChange={(edges) => graph.setEdges(edges as any)} onViewportChange={graph.updateViewport} onSelectionChange={(ids) => graph.setSelectedNodeIds(ids as any)} onNodeDoubleClick={(nodeId) => { const sectionId = graph.nodes.find((node) => node.id === nodeId)?.data?.sectionId; if (typeof sectionId === 'string') onSectionDoubleClick(sectionId); }} />
      </section>}
      {tab === 'sections' && <TilesMenu id="song-sections-menu" title="Sections" subtitle="Section definitions" tiles={song.sections.map((section) => ({ id: section.id, title: section.name, description: `Derived duration: ${section.duration.bars} bars` }))} emptyText="No sections yet." createLabel="ADD" onSelect={(tile) => onSectionDoubleClick(tile.id)} onCreate={addSection} />}
      {tab === 'sounds' && <SoundGroupsMenu title="Song Sounds" subtitle="Song-local groups plus inherited Performance groups" scope="song" sounds={[...performance.sounds, ...song.sounds]} groups={song.soundGroups} inheritedGroups={performance.soundGroups} onCreateGroup={createGroup} onCreateSound={createSound} onAssignSound={assignSound} />}
      {tab === 'motifs' && <div style={{ padding: 24 }}><ScopedResourceMenu<MotifDefinition> title="Motifs" subtitle="Performance + Song motifs" resources={motifsFor(performance, song)} ownScope="song" onCreate={createMotif} onSelect={() => {}} /></div>}
      {tab === 'code' && <CodeBlocksWorkspace resources={codeBlocksFor(performance, song)} ownScope="song" onCreate={createCode} onUpdate={updateCode} />}
    </div>
  </section>;
}

type Tab = 'graph' | 'sounds' | 'sections' | 'motifs' | 'code';
