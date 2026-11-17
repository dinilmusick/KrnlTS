/**
 * @file TimelineScrubber.tsx
 * @description Interactive timeline scrubber for execution traces and historical metrics playback
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';

export interface TimelineLogItem {
  id?: string;
  timestamp?: string;
  latencyMs?: number;
  modelId?: string;
  providerId?: string;
  status?: string;
}

export interface TimelineScrubberProps {
  logs: TimelineLogItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isPlaying?: boolean;
  onPlayPauseToggle?: (playing: boolean) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  logs,
  currentIndex,
  onIndexChange,
  isPlaying: controlledIsPlaying,
  onPlayPauseToggle,
}) => {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalPlaying;
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = (p: boolean) => {
    if (onPlayPauseToggle) onPlayPauseToggle(p);
    else setInternalPlaying(p);
  };

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        if (logs.length > 0) {
          onIndexChange((currentIndex + 1) % logs.length);
        }
      }, 1500);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, currentIndex, logs.length, onIndexChange]);

  if (logs.length === 0) return null;

  const currentLog = logs[currentIndex];
  const progressPercent = (currentIndex / Math.max(1, logs.length - 1)) * 100;

  return (
    <div className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 font-mono text-xs space-y-3 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-amber-500" />
          <span className="font-bold text-slate-800 dark:text-slate-200">TIMELINE RECONSTRUCTION</span>
        </div>
        {currentLog && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded px-1.5 py-0.5">
            Frame {currentIndex + 1}/{logs.length} — {currentLog.latencyMs ?? 0}ms — {currentLog.modelId || 'N/A'}
          </span>
        )}
      </div>

      <div className="relative h-4 flex items-center">
        <div className="absolute inset-x-0 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={logs.length - 1}
          value={currentIndex}
          onChange={(e) => {
            onIndexChange(parseInt(e.target.value, 10));
            togglePlay(false);
          }}
          className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-3 h-3 bg-amber-500 border border-white dark:border-slate-900 rounded-full pointer-events-none transition-all duration-150"
          style={{ left: `calc(${progressPercent}% - 6px)` }}
        />
      </div>

      <div className="flex items-center justify-center gap-3 pt-1">
        <BaseButton
          size="sm"
          variant="secondary"
          onClick={() => {
            onIndexChange(Math.max(0, currentIndex - 1));
            togglePlay(false);
          }}
          disabled={currentIndex === 0}
          className="p-1"
        >
          <SkipBack size={13} />
        </BaseButton>

        <BaseButton
          size="sm"
          variant="accent"
          onClick={() => togglePlay(!isPlaying)}

          className="p-1.5"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </BaseButton>

        <BaseButton
          size="sm"
          variant="secondary"
          onClick={() => {
            onIndexChange(Math.min(logs.length - 1, currentIndex + 1));
            togglePlay(false);
          }}
          disabled={currentIndex === logs.length - 1}
          className="p-1"
        >
          <SkipForward size={13} />
        </BaseButton>
      </div>
    </div>
  );
};
