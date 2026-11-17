/**
 * ASCII Architecture Flowchart: TactileKnob
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize TactileKnob      │
 *   └──────────────────────────────────┘
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { KnobTicksSvg } from './KnobTicksSvg.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface TactileKnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
  size?: number;
  onChange: (val: number) => void;
  onHoverRing?: (active: boolean) => void;
}

// ════ TACTILEKNOB IMPLEMENTATION ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const TactileKnob: React.FC<TactileKnobProps> = ({
  label,
  value,
  min = 0,
  max = 10,
  step = 0.5,
  color = 'var(--skipo-accent, #d4af37)',
  size = 76,
  onChange,
  onHoverRing
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartVal = useRef(value);

  const clampedVal = Math.max(min, Math.min(max, value));
  const range = max - min;
  const ratio = (clampedVal - min) / range;
  const angle = -135 + ratio * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartVal.current = clampedVal;
    if (onHoverRing) onHoverRing(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaY = dragStartY.current - e.clientY;
    const change = (deltaY / 100) * range;
    let nextVal = dragStartVal.current + change;
    nextVal = Math.round(nextVal / step) * step;
    nextVal = Math.max(min, Math.min(max, nextVal));
    onChange(nextVal);
  }, [isDragging, max, min, onChange, range, step]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (onHoverRing) onHoverRing(false);
  }, [onHoverRing]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    let nextVal = clampedVal + delta;
    nextVal = Math.max(min, Math.min(max, nextVal));
    onChange(nextVal);
  };

  const handleDoubleClick = () => {
    onChange(5.0);
  };

  const totalTicks = 11;
  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const tickRatio = i / (totalTicks - 1);
    const tickAngle = -135 + tickRatio * 270;
    const isActive = tickRatio <= ratio;
    return { tickAngle, isActive };
  });

  const glowBlur = clampedVal >= 7.5 ? 8 : clampedVal >= 5 ? 4 : 0;

  return (
    <div
      className="flex flex-col items-center select-none font-mono text-center group cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => onHoverRing && onHoverRing(true)}
      onMouseLeave={() => !isDragging && onHoverRing && onHoverRing(false)}
    >
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center"
      >
        <KnobTicksSvg
          size={size}
          ticks={ticks}
          color={color}
          clampedVal={clampedVal}
        />

        <div
          className={`relative rounded-full border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] transition-transform duration-75 flex items-center justify-center ${
            isDragging ? 'scale-105' : ''
          }`}
          style={{
            width: size * 0.72,
            height: size * 0.72,
            boxShadow: isDragging || clampedVal >= 8 ? `0 0 ${glowBlur}px ${color}` : undefined
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div
              className="w-1.5 h-3 rounded-full absolute -top-0.5"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 ${Math.max(2, glowBlur)}px ${color}`
              }}
            />
          </div>

          <div
            className="w-4 h-4 rounded-full border border-[var(--skipo-border-color)] bg-[var(--skipo-matte-bg)] flex items-center justify-center"
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color, opacity: Math.max(0.3, ratio) }}
            />
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-center gap-1">
        <span
          className="text-[11px] font-black px-1.5 py-0.5 rounded border border-[var(--skipo-border-color)]/60 bg-[var(--skipo-surface)] leading-none shadow-[var(--skipo-shadow-btn)]"
          style={{
            color: color,
            textShadow: clampedVal >= 8 ? `0 0 6px ${color}` : undefined
          }}
        >
          {clampedVal.toFixed(1)}
        </span>
      </div>

      <span className="mt-0.5 text-[9.5px] font-bold tracking-tight text-[var(--skipo-text)] max-w-[84px] truncate leading-tight" title={label}>
        {label}
      </span>
    </div>
  );
};