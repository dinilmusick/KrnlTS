'use client';

import { BaseInput, BaseSelect } from '@ultrst-armada/floks/ui';
import { MidiTimeline } from '@ultrst-armada/floks/ui';
import { durationFromBars, type MidiNoteDefinition } from './executionFlowGraph.js';

export function MidiSampleEditorPanel({ label, notes, duration, motifId, motifs = [], onMotifChange, onNotesChange, onBarsChange, instruments, sounds = [] }: {
  label: string;
  notes: MidiNoteDefinition[];
  duration: ReturnType<typeof durationFromBars>;
  motifId?: string;
  motifs?: Array<{ id: string; name: string; scope: string }>;
  onMotifChange: (id: string) => void;
  onNotesChange: (n: MidiNoteDefinition[]) => void;
  onBarsChange: (b: number) => void;
  instruments: string[];
  sounds?: string[];
}) {
  const snap = (value: number) => Math.max(0, Math.round(value));
  const handle = (next: MidiNoteDefinition[]) => onNotesChange(next.map(note => ({
    ...note,
    pitch: Math.max(0, Math.min(127, Math.round(note.pitch))),
    start: snap(note.start),
    duration: Math.max(1, snap(note.duration)),
  })));
  const motifOptions = [{ label: 'None', value: '' }, ...motifs.map(motif => ({
    label: `${motif.name} · ${motif.scope}`, value: motif.id,
  }))];
  return <aside style={{ minWidth: 0, minHeight: 0, overflow: 'auto', borderLeft: 'var(--skipo-border)', padding: 12, background: 'var(--skipo-surface)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <strong style={{ fontSize: 12 }}>{label}</strong>
      <label style={{ fontSize: 11, marginLeft: 'auto' }}>
        Bars
        <BaseInput aria-label="MIDI sample bars" type="number" min={1 / 256} step={1 / 256} value={duration.bars} onChange={event => onBarsChange(Number(event.target.value))} style={{ width: 70, marginLeft: 6 }} />
      </label>
    </div>
    <label style={{ display: 'block', fontSize: 11, marginBottom: 8 }}>
      Motif
      <BaseSelect value={motifId ?? ''} options={motifOptions} onChange={event => onMotifChange(event.target.value)} style={{ marginLeft: 6, minWidth: 180 }} />
    </label>
    <MidiTimeline notes={notes} loopLength={duration.beatFractions} onChange={handle} style={{ minHeight: 420 }} />
    <div style={{ marginTop: 8, fontSize: 11 }}>{duration.bars} bars · {duration.beats} beats · {duration.beatFractions} beat fractions</div>
    <div style={{ marginTop: 16, fontSize: 11 }}><strong>Song instruments</strong><div style={{ marginTop: 6 }}>{instruments.join(' · ') || 'None'}</div></div>
    <div style={{ marginTop: 16, fontSize: 11 }}><strong>Available Sounds</strong><div style={{ marginTop: 6 }}>{sounds.join(' · ') || 'None'}</div></div>
  </aside>;
}
