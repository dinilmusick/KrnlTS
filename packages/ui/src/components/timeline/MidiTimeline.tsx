import React, { useEffect, useRef } from 'react';

export const MIDI_MIN = 0;
export const MIDI_MAX = 127;
export const MIDI_TIMELINE_HEIGHT = 768;

export interface MidiTimelineNote {
  id: string;
  pitch: number;
  start: number;
  duration: number;
}

export interface MidiTimelineProps {
  notes: MidiTimelineNote[];
  loopLength: number;
  playhead?: number;
  color?: string;
  selectedNoteId?: string | null;
  onChange?: (notes: MidiTimelineNote[]) => void;
  onSelect?: (noteId: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
}

const clampPitch = (pitch: number) => Math.max(MIDI_MIN, Math.min(MIDI_MAX, Math.round(pitch)));
const wrapTime = (time: number, length: number) => length <= 0 ? 0 : ((time % length) + length) % length;
const xToTime = (x: number, width: number, length: number) => width <= 0 || length <= 0 ? 0 : Math.max(0, Math.min(length, x / width * length));
const yToPitch = (y: number, height: number) => height <= 0 ? MIDI_MIN : clampPitch(MIDI_MAX - Math.max(0, Math.min(1, y / height)) * (MIDI_MAX - MIDI_MIN));
const pitchToY = (pitch: number, height: number) => height <= 0 ? 0 : (MIDI_MAX - clampPitch(pitch)) / (MIDI_MAX - MIDI_MIN) * height;

export function MidiTimeline({
  notes,
  loopLength,
  playhead = 0,
  color = 'var(--skipo-accent, #4f8cff)',
  selectedNoteId = null,
  onChange,
  onSelect,
  className,
  style,
}: MidiTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interaction = useRef<{ kind: 'draw' | 'move'; id: string; start: number; pitch: number; x: number } | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = MIDI_TIMELINE_HEIGHT * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = rect.width;
    const rowHeight = MIDI_TIMELINE_HEIGHT / 128;
    ctx.clearRect(0, 0, width, MIDI_TIMELINE_HEIGHT);
    ctx.fillStyle = 'var(--skipo-bg, #0b0d12)';
    ctx.fillRect(0, 0, width, MIDI_TIMELINE_HEIGHT);

    for (let pitch = 0; pitch < 128; pitch += 1) {
      const y = pitchToY(pitch, MIDI_TIMELINE_HEIGHT);
      const black = [1, 3, 6, 8, 10].includes(pitch % 12);
      ctx.fillStyle = black ? '#11151d' : '#0e1219';
      ctx.fillRect(0, y, width, rowHeight + 0.5);
      ctx.strokeStyle = pitch % 12 === 0 ? '#39404c' : '#202631';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      if (pitch % 12 === 0) {
        ctx.fillStyle = '#7f8794'; ctx.font = '10px sans-serif';
        ctx.fillText(`C${Math.floor(pitch / 12) - 1}`, 6, y + rowHeight - 1);
      }
    }

    for (let beat = 0; beat <= loopLength; beat += 1) {
      const x = beat * width / Math.max(1, loopLength);
      ctx.strokeStyle = beat % 4 === 0 ? '#3b4350' : '#252b35';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MIDI_TIMELINE_HEIGHT); ctx.stroke();
    }

    for (const note of notes) {
      const x = wrapTime(note.start, loopLength) / Math.max(1, loopLength) * width;
      const noteWidth = Math.max(3, note.duration / Math.max(1, loopLength) * width);
      const y = pitchToY(note.pitch, MIDI_TIMELINE_HEIGHT) + 1;
      ctx.globalAlpha = note.id === selectedNoteId ? 1 : 0.82;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, Math.min(noteWidth, width - x), Math.max(3, rowHeight - 2));
      if (note.id === selectedNoteId) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(1, Math.min(noteWidth, width - x) - 1), Math.max(1, rowHeight - 3));
      }
    }

    ctx.globalAlpha = 1;
    const playheadX = wrapTime(playhead, loopLength) / Math.max(1, loopLength) * width;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, MIDI_TIMELINE_HEIGHT); ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [notes, loopLength, playhead, selectedNoteId, color]);

  const pointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = [...notes].reverse().find((note) => {
      const nx = wrapTime(note.start, loopLength) / Math.max(1, loopLength) * rect.width;
      const nw = Math.max(3, note.duration / Math.max(1, loopLength) * rect.width);
      return x >= nx && x <= nx + nw && y >= pitchToY(note.pitch, MIDI_TIMELINE_HEIGHT) && y <= pitchToY(note.pitch, MIDI_TIMELINE_HEIGHT) + MIDI_TIMELINE_HEIGHT / 128;
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (hit) {
      onSelect?.(hit.id);
      interaction.current = { kind: 'move', id: hit.id, start: hit.start, pitch: hit.pitch, x };
      return;
    }
    const note: MidiTimelineNote = { id: crypto.randomUUID(), pitch: yToPitch(y, MIDI_TIMELINE_HEIGHT), start: xToTime(x, rect.width, loopLength), duration: 0.25 };
    onSelect?.(note.id);
    onChange?.([...notes, note]);
    interaction.current = { kind: 'draw', id: note.id, start: note.start, pitch: note.pitch, x };
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const active = interaction.current;
    if (!active || !onChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const time = xToTime(x, rect.width, loopLength);
    onChange(notes.map((note) => {
      if (note.id !== active.id) return note;
      if (active.kind === 'draw') return { ...note, duration: Math.max(0.125, time - active.start) };
      const deltaTime = time - xToTime(active.x, rect.width, loopLength);
      const deltaPitch = (active.pitch - yToPitch(y, MIDI_TIMELINE_HEIGHT));
      return { ...note, start: Math.max(0, Math.min(Math.max(0, loopLength - 0.001), active.start + deltaTime)), pitch: clampPitch(active.pitch + deltaPitch) };
    }));
  };

  const finish = (event: React.PointerEvent<HTMLCanvasElement>) => {
    interaction.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className={className} style={{ overflow: 'auto', border: '1px solid var(--skipo-border-color, #2c3340)', ...style }}>
      <canvas
        ref={canvasRef}
        height={MIDI_TIMELINE_HEIGHT}
        style={{ display: 'block', width: '100%', height: MIDI_TIMELINE_HEIGHT, touchAction: 'none', cursor: 'crosshair' }}
        aria-label="MIDI timeline. Y axis is MIDI pitch 0 to 127 and X axis is musical time."
        onPointerDown={pointer}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
    </div>
  );
}

export default MidiTimeline;
