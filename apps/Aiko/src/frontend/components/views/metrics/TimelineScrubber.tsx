/**
 * ASCII Architecture Flowchart: TimelineScrubber
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize TimelineScrubber    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         TimelineScrubber         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         playIntervalRef          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            currentLog            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import { BaseButton, BaseInput } from '@ultrst-armada/floks';
import { RequestLogEntry } from '../../../types/app.js';
import { Tooltip } from '../../common/Tooltip.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface TimelineScrubberProps {
  logs: RequestLogEntry[];
  currentIndex: number;
  onIndexChange?: (index: number) => void;
  onChange?: (index: number) => void;
  isPlaying?: boolean;
  onPlayPauseToggle?: (playing: boolean) => void;
}


// ════ TIMELINESCRUBBER IMPLEMENTATION ═════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  logs,
  currentIndex,
  onIndexChange,
  onChange,
  isPlaying: controlledIsPlaying,
  onPlayPauseToggle: controlledToggle
}) => {
  const [internalPlaying, setInternalPlaying] = React.useState(false);
  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalPlaying;
  const handleIndexChange = onIndexChange || onChange || (() => {});
  const handlePlayPause = controlledToggle || ((p: boolean) => setInternalPlaying(p));

  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play advances the index over time
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        if (logs.length > 0) {
          handleIndexChange((currentIndex + 1) % logs.length);
        }
      }, 2000); // Step every 2 seconds
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, logs.length, handleIndexChange]);

  if (logs.length === 0) return null;

  const currentLog = logs[currentIndex];
  const progressPercent = ((currentIndex) / Math.max(1, logs.length - 1)) * 100;

  // Format simple hour:minute:second
  const formatTime = (log: RequestLogEntry) => {
    // Generate simulated or real timestamp
    const date = new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="border-2 border-slate-700 bg-slate-950/90 rounded-xl p-4 font-mono shadow-[3px_3px_0px_0px_var(--skipo-border-color)] space-y-4">
      {/* Playback info readout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="text-yellow-500 animate-spin" style={{ animationDuration: isPlaying ? '6s' : '0s' }} size={16} />
          <span className="text-xs font-bold text-slate-300">HISTORICAL NERVE RECONSTRUCTION</span>
        </div>
        {currentLog && (
          <div className="text-[10px] text-yellow-500 bg-yellow-950/40 border border-yellow-700/50 rounded px-2 py-0.5 self-start">
            Frame {currentIndex + 1} of {logs.length} — Latency: {currentLog.latencyMs}ms — {currentLog.selectedModel || currentLog.modelId}
          </div>
        )}
      </div>

      {/* Main Scrubber Slider */}
      <div className="space-y-1">
        <div className="relative h-6 flex items-center">
          {/* Custom Track */}
          <div className="absolute inset-x-0 h-2 bg-slate-800 border border-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Range Slider Overlay */}
          <BaseInput
            type="range"
            min="0"
            max={logs.length - 1}
            value={currentIndex}
            onChange={(e) => {
              handleIndexChange(parseInt(e.target.value, 10));
              handlePlayPause(false); // Pause on scrub
            }}
            className="absolute inset-x-0 w-full h-full opacity-0 cursor-ew-resize z-10"
          />

          {/* Styled Thumb */}
          <div 
            className="absolute w-4 h-4 bg-yellow-400 border-2 border-slate-950 rounded shadow-md pointer-events-none transition-all duration-150"
            style={{ 
              left: `calc(${progressPercent}% - 8px)`,
              boxShadow: '0 0 8px var(--skipo-accent-glow)'
            }}
          />
        </div>

        {/* Video Timeline ticks */}
        <div className="flex justify-between text-[8px] text-slate-500 px-1 font-bold">
          <span>00:00 (START)</span>
          <span>MIDPOINT</span>
          <span>LIVE NOW (END)</span>
        </div>
      </div>

      {/* Video-style button deck */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <BaseButton
          onClick={() => {
            handleIndexChange(Math.max(0, currentIndex - 1));
            handlePlayPause(false);
          }}
          disabled={currentIndex === 0}
          className="p-1.5 border-2 border-slate-700 bg-slate-900 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all"
          title="Previous Call"
        >
          <SkipBack size={14} />
        </BaseButton>

        <Tooltip text={isPlaying ? 'PAUSE' : 'PLAY RECONSTRUCTION'}>
          <BaseButton
            onClick={() => handlePlayPause(!isPlaying)}
            className={`p-3 border-2 border-slate-700 rounded font-bold flex items-center justify-center transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-rose-950/80 text-rose-400 hover:bg-rose-900 shadow-[2px_2px_0px_0px_var(--skipo-danger,#f43f5e)]' 
                : 'bg-yellow-950/80 text-yellow-400 hover:bg-yellow-900 shadow-[2px_2px_0px_0px_var(--skipo-warning,#eab308)]'
            }`}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </BaseButton>
        </Tooltip>

        <BaseButton
          onClick={() => {
            handleIndexChange(Math.min(logs.length - 1, currentIndex + 1));
            handlePlayPause(false);
          }}
          disabled={currentIndex === logs.length - 1}
          className="p-1.5 border-2 border-slate-700 bg-slate-900 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all"
          title="Next Call"
        >
          <SkipForward size={14} />
        </BaseButton>
      </div>
    </div>
  );
};