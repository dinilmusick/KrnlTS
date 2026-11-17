// ══════════════════════════════════════════════════════════════════════════════════════════
// RotaryKnob: Circular Parameter Controller Hooked into Active Theme Palette
// ══════════════════════════════════════════════════════════════════════════════════════════
// @role component
import React, { useRef, useCallback, useState } from 'react';
import { describeSvgArc } from '@floks/contracts';
import { usePalette } from '@floks/ui';

export interface RotaryKnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  unit?: string;
  formatValue?: (val: number) => string;
  title?: string;
  disabled?: boolean;
  className?: string;
}

export function RotaryKnob({
  value,
  min = 0,
  max = 1,
  step,
  defaultValue,
  onChange,
  size = 38,
  color,
  trackColor,
  label,
  unit = '',
  formatValue,
  title,
  disabled = false,
  className = '',
}: RotaryKnobProps) {
  const palette = usePalette();
  const effectiveColor = color || palette.accentPrimary;
  const effectiveTrackColor = trackColor || palette.borderSubtle;
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isEngaged, setIsEngaged] = useState<boolean>(false);

  const clampedVal = Math.min(max, Math.max(min, value));
  const range = max - min || 1;
  const normalized = (clampedVal - min) / range;
  const minAngle = -135;
  const maxAngle = 135;
  const currentAngle = minAngle + normalized * (maxAngle - minAngle);
  const strokeWidth = Math.max(2.5, size * 0.08);
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const bgArc = describeSvgArc(cx, cy, radius, minAngle, maxAngle);
  const valArc = normalized > 0.005 ? describeSvgArc(cx, cy, radius, minAngle, currentAngle) : '';

  const snapValue = useCallback((raw: number) => {
    let v = Math.min(max, Math.max(min, raw));
    if (step && step > 0) v = Math.round((v - min) / step) * step + min;
    return parseFloat(v.toFixed(4));
  }, [min, max, step]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startValRef.current = clampedVal;
    setIsEngaged(true);
    knobRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const sensitivity = e.shiftKey ? 400 : 150;
    const deltaVal = ((startYRef.current - e.clientY) / sensitivity) * range;
    const newVal = snapValue(startValRef.current + deltaVal);
    if (newVal !== clampedVal) onChange(newVal);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsEngaged(false);
      try { knobRef.current?.releasePointerCapture(e.pointerId); } catch {}
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const newVal = snapValue(clampedVal - Math.sign(e.deltaY) * (step || range * 0.02));
    if (newVal !== clampedVal) onChange(newVal);
  };

  const formattedDisplay = formatValue
    ? formatValue(clampedVal)
    : unit === '%' ? `${Math.round(clampedVal * 100)}%`
    : unit ? `${clampedVal.toFixed(step && step < 0.1 ? 2 : 1)}${unit}`
    : typeof clampedVal === 'number' && Number.isInteger(clampedVal) ? `${clampedVal}`
    : `${clampedVal.toFixed(2)}`;

  return (
    <div
      className={`inline-flex flex-col items-center select-none font-mono ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-ns-resize'} ${className}`}
      title={title || (label ? `${label}: ${formattedDisplay}` : formattedDisplay)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {label && (
        <span style={{ color: palette.textMuted }} className="text-[9px] uppercase font-bold tracking-wider mb-1 text-center truncate max-w-[80px]">
          {label}
        </span>
      )}
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={(e) => { if (!disabled && defaultValue !== undefined) { e.stopPropagation(); onChange(defaultValue); } }}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center touch-none group"
      >
        <svg width={size} height={size} className="overflow-visible">
          <path d={bgArc} fill="none" stroke={effectiveTrackColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          {normalized > 0.005 && (
            <path
              d={valArc}
              fill="none"
              stroke={effectiveColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-75"
              style={{ filter: isEngaged || isHovered ? `drop-shadow(0 0 4px ${effectiveColor})` : undefined }}
            />
          )}
        </svg>
        <div
          style={{
            width: size - strokeWidth * 3.2,
            height: size - strokeWidth * 3.2,
            transform: `rotate(${currentAngle}deg)`,
            borderColor: isEngaged ? effectiveColor : isHovered ? palette.borderBold : palette.borderMedium,
            backgroundColor: palette.bgSurface,
          }}
          className="absolute rounded-full border flex items-start justify-center transition-colors duration-150"
        >
          <div
            style={{
              backgroundColor: effectiveColor,
              width: Math.max(2, size * 0.06),
              height: size * 0.24,
              boxShadow: `0 0 5px ${effectiveColor}`,
            }}
            className="mt-0.5 rounded-full"
          />
        </div>
      </div>
      <span style={{ color: isEngaged ? effectiveColor : palette.textSecondary }} className="text-[10px] font-bold mt-1 text-center transition-colors">
        {formattedDisplay}
      </span>
    </div>
  );
}
