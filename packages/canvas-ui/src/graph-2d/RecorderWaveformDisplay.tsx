import React, {useEffect, useRef, useState} from 'react';
import type {RecorderNode, SpaceNode, NodeConnection} from '@floks/contracts';

export interface RecorderWaveformDisplayProps {
  node: RecorderNode;
  connections?: NodeConnection[];
  allNodes?: SpaceNode[];
  width?: number;
}

function buildWaveformPath(peaks: number[], width: number, height: number): string {
  if (peaks.length === 0) return `M 0 ${height / 2} L ${width} ${height / 2}`;
  const step = width / Math.max(1, peaks.length - 1);
  const mid = height / 2;
  const top: string[] = [];
  const bottom: string[] = [];
  peaks.forEach((peak, index) => {
    const x = Math.round(index * step * 10) / 10;
    const amp = Math.max(0.08, Math.min(1, peak)) * (mid - 2);
    top.push(`${index === 0 ? 'M' : 'L'} ${x} ${mid - amp}`);
    bottom.unshift(`L ${x} ${mid + amp}`);
  });
  return `${top.join(' ')} ${bottom.join(' ')} Z`;
}

export const RecorderWaveformDisplay: React.FC<RecorderWaveformDisplayProps> = ({node, width = 150}) => {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [phase, setPhase] = useState(0);
  const isArmed = !!node.isArmed;
  const isRetrospective = node.recordingMode === 'retrospective';
  const isRecording = !isRetrospective && !!node.isRecording;
  const isStereo = node.recorderType !== 'audio_mono';
  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    if (!isArmed) return;
    let frame = 0;
    const tick = (time: number) => {
      const previous = lastTime.current ?? time;
      const deltaSeconds = Math.min(0.1, (time - previous) / 1000);
      lastTime.current = time;
      setCurrentBeat((beat) => beat + deltaSeconds * 2);
      setPhase((value) => value + deltaSeconds * 5);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastTime.current = null;
    };
  }, [isArmed]);

  if (!isArmed) return null;

  const elapsedBeats = isRecording ? Math.max(0, currentBeat - (node.recordingStartBeat || 0)) : 0;
  const bars = Math.floor(elapsedBeats / 4);
  const beatsInBar = (elapsedBeats % 4).toFixed(1);
  const timeText = isRecording
    ? `${bars} BAR${bars === 1 ? '' : 'S'} ${beatsInBar} BEATS`
    : isRetrospective
      ? `${node.bufferLengthBars ?? 4} BARS BUFFER`
      : '1 BAR PREVIEW';

  const red = isRecording;
  const stroke = red ? '#f43f5e' : '#94a3b8';
  const fill = red ? 'rgba(244, 63, 94, 0.25)' : 'rgba(148, 163, 184, 0.15)';
  const sample = (offset: number) => Array.from({length: 32}, (_, i) => {
    const base = 0.18 + 0.22 * Math.abs(Math.sin(i * 0.65 + phase + offset));
    const accent = 0.12 * Math.abs(Math.sin(i * 1.7 + phase * 0.7));
    return Math.min(1, base + accent);
  });
  const left = sample(0);
  const right = sample(1.4);
  const trackHeight = isStereo ? 18 : 36;

  return (
    <div className="flex flex-col items-center justify-center w-full px-1 py-1 rounded bg-black/60 border border-slate-800 select-none overflow-hidden">
      <div className="flex items-center justify-between w-full px-1 mb-0.5 text-[8px] font-mono font-bold tracking-tight">
        <span className={red ? 'text-rose-400 animate-pulse' : 'text-slate-400'}>{red ? '● REC' : isRetrospective ? '● BUFFER' : 'ARMED'}</span>
        <span className={red ? 'text-rose-300 font-extrabold' : 'text-slate-400'}>{timeText}</span>
      </div>
      <div className="flex flex-col gap-0.5 w-full">
        <div className={`relative w-full ${isStereo ? 'h-[18px]' : 'h-[36px]'} bg-slate-950/80 rounded border border-slate-800/80 overflow-hidden`}>
          {isStereo && <span className="absolute top-0.5 left-1 text-[7px] font-mono font-bold text-slate-500 z-10">L</span>}
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${trackHeight}`} preserveAspectRatio="none">
            <path d={buildWaveformPath(left, width, trackHeight)} fill={fill} stroke={stroke} strokeWidth="1.2" />
          </svg>
        </div>
        {isStereo && (
          <div className="relative w-full h-[18px] bg-slate-950/80 rounded border border-slate-800/80 overflow-hidden">
            <span className="absolute top-0.5 left-1 text-[7px] font-mono font-bold text-slate-500 z-10">R</span>
            <svg className="w-full h-full" viewBox={`0 0 ${width} ${trackHeight}`} preserveAspectRatio="none">
              <path d={buildWaveformPath(right, width, trackHeight)} fill={fill} stroke={stroke} strokeWidth="1.2" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
