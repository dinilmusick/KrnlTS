import React, { useRef } from 'react';

export interface MusicalTimelineProps {
  bars?: number;
  beatsPerBar?: number;
  pixelsPerBeat?: number;
  playhead?: number;
  playing?: boolean;
  onPlayheadChange?: (beat: number) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>, beat: number) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MusicalTimeline({
  bars = 4,
  beatsPerBar = 4,
  pixelsPerBeat = 64,
  playhead = 0,
  playing = false,
  onPlayheadChange,
  onDrop,
  children,
  className,
  style,
}: MusicalTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const totalBeats = Math.max(1, bars * beatsPerBar);
  const width = totalBeats * pixelsPerBeat;

  const beatAt = (clientX: number) => {
    const element = timelineRef.current;
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return Math.max(0, Math.min(totalBeats, (clientX - rect.left + element.scrollLeft) / pixelsPerBeat));
  };

  const seek = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    onPlayheadChange?.(beatAt(event.clientX));
  };

  return (
    <div
      ref={timelineRef}
      className={className}
      style={{ position: 'relative', overflow: 'auto', minHeight: 240, border: '1px solid var(--skipo-border-color, #2c3340)', background: 'var(--skipo-bg, #0b0d12)', ...style }}
      aria-label="Musical timeline"
      onPointerDown={seek}
      onDragOver={(event) => { if (onDrop) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
      onDrop={(event) => { if (onDrop) { event.preventDefault(); onDrop(event, beatAt(event.clientX)); } }}
    >
      <div style={{ position: 'relative', width, minHeight: 240 }}>
        {Array.from({ length: totalBeats + 1 }, (_, beat) => {
          const bar = Math.floor(beat / beatsPerBar);
          const isBar = beat % beatsPerBar === 0;
          return (
            <div key={beat} style={{ position: 'absolute', left: beat * pixelsPerBeat, top: 0, bottom: 0, width: 1, background: isBar ? '#3b4350' : '#202631', pointerEvents: 'none' }}>
              {beat < totalBeats && (
                <span style={{ position: 'absolute', top: 5, left: 5, fontSize: 10, color: '#697283', whiteSpace: 'nowrap' }}>
                  {isBar ? `Bar ${bar + 1}` : `${bar + 1}.${beat % beatsPerBar + 1}`}
                </span>
              )}
            </div>
          );
        })}
        {Array.from({ length: Math.max(1, Math.ceil(240 / 72)) }, (_, lane) => (
          <div key={lane} style={{ position: 'absolute', left: 0, right: 0, top: lane * 72, height: 72, borderTop: '1px solid #202631', pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'absolute', left: Math.max(0, Math.min(totalBeats, playhead)) * pixelsPerBeat, top: 0, bottom: 0, width: 2, background: '#fff', pointerEvents: 'none', zIndex: 10 }} aria-hidden="true" />
        <div style={{ position: 'absolute', left: 0, top: 24, right: 0, bottom: 0 }}>{children}</div>
      </div>
      <div style={{ position: 'sticky', left: 8, bottom: 0, display: 'inline-flex', gap: 8, margin: '8px', fontSize: 11, color: 'var(--skipo-text-muted, #8f98a8)', background: 'var(--skipo-bg, #0b0d12)' }}>
        {playing ? 'Playing' : 'Stopped'} · {Math.floor(playhead / beatsPerBar) + 1}.{Math.floor(playhead % beatsPerBar) + 1}
      </div>
    </div>
  );
}

export default MusicalTimeline;
