// ══════════════════════════════════════════════════════════════════════════════
// FLOKS CANONICAL FRNL FORM CONTROLS (frnlSelect, frnlToggle, frnlSlider, frnlBadge)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useId, useMemo } from 'react';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from './store.js';
import { useBottomStrip } from '../components/bottom-strip/index.js';

// ── 1. frnlSelect ──

export interface FrnlSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FrnlSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  id?: string;
  label?: string;
  description?: string;
  options: FrnlSelectOption[];
  size?: 'sm' | 'md' | 'lg';
}

export const frnlSelectDefinition = defineFrnlComponent({
  name: 'frnlSelect',
  states: {
    idle: {
      name: 'idle',
      events: { change: { functionId: 'frnlSelect.idle.change' } },
      visualParameters: {},
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    disabled: {
      name: 'disabled',
      events: {},
      visualParameters: { opacity: 0.5 },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

export const frnlSelect: React.FC<FrnlSelectProps> = ({
  id,
  label,
  description,
  options,
  size = 'md',
  disabled = false,
  value,
  onChange,
  onMouseEnter,
  onMouseLeave,
  className = '',
  style,
  ...rest
}) => {
  const store = useFloksFrnlStore();
  const { setInspectionText } = useBottomStrip();
  const generatedId = useId().replace(/[:/]/g, '');
  const componentId = id ?? `frnlSelect.${label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId}`;

  const handlers = useMemo(
    () => ({
      'frnlSelect.idle.change': (payload: unknown) => onChange?.(payload as any),
    }),
    [onChange]
  );

  const frnl = useFrnlComponent({
    id: componentId,
    definition: frnlSelectDefinition,
    store,
    state: disabled ? 'disabled' : 'idle',
    properties: { label, disabled },
    handlers,
  });

  const heightClass = size === 'sm' ? 'h-7 text-xs' : size === 'lg' ? 'h-10 text-sm' : 'h-8 text-xs';

  return (
    <div className={`flex flex-col gap-1 font-mono select-none ${className}`}>
      {label && (
        <label
          htmlFor={componentId}
          className="text-[10px] font-bold uppercase tracking-wider text-[var(--skipo-text-muted,#94a3b8)]"
        >
          {label}
        </label>
      )}
      <select
        {...rest}
        id={componentId}
        value={value}
        disabled={disabled}
        data-frnl-component="frnlSelect"
        data-frnl-state={frnl.state}
        onChange={(e) => {
          onChange?.(e);
          frnl.events.change?.(e);
        }}
        onMouseEnter={(e) => {
          onMouseEnter?.(e);
          if (label || description) setInspectionText(label || null, description || null);
        }}
        onMouseLeave={(e) => {
          onMouseLeave?.(e);
          setInspectionText(null);
        }}
        className={`w-full bg-[var(--skipo-bg-panel,#0f172a)] text-[var(--skipo-text-primary,#f8fafc)] border border-[var(--skipo-border-subtle,#334155)] rounded px-2.5 py-1 focus:outline-none focus:border-[var(--skipo-accent,#38bdf8)] disabled:opacity-40 disabled:cursor-not-allowed ${heightClass}`}
        style={style}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-[#0f172a] text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
frnlSelect.displayName = 'frnlSelect';

// ── 2. frnlToggle ──

export interface FrnlToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const frnlToggleDefinition = defineFrnlComponent({
  name: 'frnlToggle',
  states: {
    off: {
      name: 'off',
      events: { toggle: { functionId: 'frnlToggle.off.toggle' } },
      visualParameters: { checked: false },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    on: {
      name: 'on',
      events: { toggle: { functionId: 'frnlToggle.on.toggle' } },
      visualParameters: { checked: true },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

export const frnlToggle: React.FC<FrnlToggleProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) => {
  const store = useFloksFrnlStore();
  const { setInspectionText } = useBottomStrip();
  const generatedId = useId().replace(/[:/]/g, '');
  const componentId = id ?? `frnlToggle.${label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId}`;

  const handlers = useMemo(
    () => ({
      'frnlToggle.off.toggle': () => onChange(true),
      'frnlToggle.on.toggle': () => onChange(false),
    }),
    [onChange]
  );

  const frnl = useFrnlComponent({
    id: componentId,
    definition: frnlToggleDefinition,
    store,
    state: checked ? 'on' : 'off',
    properties: { label, checked, disabled },
    handlers,
  });

  return (
    <button
      type="button"
      role="switch"
      id={componentId}
      aria-checked={checked}
      disabled={disabled}
      data-frnl-component="frnlToggle"
      data-frnl-state={frnl.state}
      onClick={() => {
        if (disabled) return;
        frnl.events.toggle?.(undefined);
      }}
      onMouseEnter={() => {
        if (label || description) setInspectionText(label || null, description || null);
      }}
      onMouseLeave={() => setInspectionText(null)}
      className={`inline-flex items-center gap-2 select-none font-mono text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <div
        className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
          checked ? 'bg-[var(--skipo-accent,#38bdf8)]' : 'bg-[var(--skipo-border-subtle,#334155)]'
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full bg-black transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      {label && <span className="text-[var(--skipo-text-primary,#f8fafc)] uppercase text-[11px] font-semibold">{label}</span>}
    </button>
  );
};
frnlToggle.displayName = 'frnlToggle';

// ── 3. frnlSlider ──

export interface FrnlSliderProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const frnlSlider: React.FC<FrnlSliderProps> = ({
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  description,
  disabled = false,
  className = '',
}) => {
  const { setInspectionText } = useBottomStrip();
  const generatedId = useId().replace(/[:/]/g, '');
  const componentId = id ?? `frnlSlider.${label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId}`;

  return (
    <div
      id={componentId}
      data-frnl-component="frnlSlider"
      onMouseEnter={() => {
        if (label || description) setInspectionText(label || null, description || null);
      }}
      onMouseLeave={() => setInspectionText(null)}
      className={`flex flex-col gap-1 font-mono select-none ${className}`}
    >
      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
        {label && <span className="text-[var(--skipo-text-muted,#94a3b8)]">{label}</span>}
        <span className="text-[var(--skipo-accent,#38bdf8)]">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-[var(--skipo-border-subtle,#334155)] accent-[var(--skipo-accent,#38bdf8)] cursor-pointer disabled:opacity-40"
      />
    </div>
  );
};
frnlSlider.displayName = 'frnlSlider';

// ── 4. frnlBadge ──

export interface FrnlBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const BADGE_STYLES: Record<string, string> = {
  neutral: 'bg-[var(--skipo-bg-subtle,#1e293b)] border-[var(--skipo-border-subtle,#334155)] text-[var(--skipo-text-muted,#94a3b8)]',
  accent: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  danger: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

export const frnlBadge: React.FC<FrnlBadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...rest
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.2 text-[9px]' : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      {...rest}
      data-frnl-component="frnlBadge"
      className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider border rounded select-none ${BADGE_STYLES[variant]} ${sizeClasses} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
};
frnlBadge.displayName = 'frnlBadge';
