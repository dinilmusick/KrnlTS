// ══════════════════════════════════════════════════════════════════════════════
// FLOKS CANONICAL FRNL BUTTON (frnlButton)
// Direct FrnlTS-backed interactive button component
// ══════════════════════════════════════════════════════════════════════════════
import React, { useId, useMemo } from 'react';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from './store.js';
import { useBottomStrip } from '../components/bottom-strip/index.js';

export type FrnlButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'dock'
  | 'danger'
  | 'success'
  | 'ghost'
  | 'outline';

export type FrnlButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FrnlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id?: string;
  variant?: FrnlButtonVariant;
  size?: FrnlButtonSize;
  label?: string;
  tooltip?: string;
  description?: string;
  isActive?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const frnlButtonDefinition = defineFrnlComponent({
  name: 'frnlButton',
  states: {
    idle: {
      name: 'idle',
      events: { click: { functionId: 'frnlButton.idle.click' } },
      visualParameters: { opacity: 1 },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    hover: {
      name: 'hover',
      events: { click: { functionId: 'frnlButton.hover.click' } },
      visualParameters: { opacity: 1 },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    active: {
      name: 'active',
      events: { click: { functionId: 'frnlButton.active.click' } },
      visualParameters: { opacity: 1 },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    disabled: {
      name: 'disabled',
      events: { click: { functionId: 'frnlButton.disabled.click' } },
      visualParameters: { opacity: 0.4 },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    loading: {
      name: 'loading',
      events: { click: { functionId: 'frnlButton.loading.click' } },
      visualParameters: { opacity: 0.6 },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

const SIZE_CLASSES: Record<FrnlButtonSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1 h-6',
  sm: 'px-2.5 py-1 text-xs gap-1.5 h-7',
  md: 'px-3.5 py-1.5 text-xs gap-2 h-8',
  lg: 'px-4 py-2 text-sm gap-2.5 h-10',
  xl: 'px-5 py-2.5 text-base gap-3 h-12',
};

const VARIANT_STYLES: Record<FrnlButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--skipo-bg-surface, #1e293b)',
    borderColor: 'var(--skipo-border-subtle, #334155)',
    color: 'var(--skipo-text-primary, #f8fafc)',
  },
  secondary: {
    backgroundColor: 'var(--skipo-bg-panel, #0f172a)',
    borderColor: 'var(--skipo-border-subtle, #334155)',
    color: 'var(--skipo-text-muted, #94a3b8)',
  },
  accent: {
    backgroundColor: 'var(--skipo-accent, #d4af37)',
    borderColor: 'var(--skipo-accent-contrast, var(--skipo-border-color, #3b4250))',
    color: 'var(--skipo-accent-fg, #000000)',
    fontWeight: 700,
  },
  dock: {
    backgroundColor: 'var(--skipo-bg-subtle, #1e293b)',
    borderColor: 'var(--skipo-border-color, #334155)',
    color: 'var(--skipo-text-primary, #f8fafc)',
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    color: '#f87171',
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    color: '#34d399',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: 'var(--skipo-text-muted, #94a3b8)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: 'var(--skipo-border-subtle, #334155)',
    color: 'var(--skipo-text-primary, #f8fafc)',
  },
};

export const frnlButton: React.FC<FrnlButtonProps> = ({
  id,
  variant = 'secondary',
  size = 'md',
  label,
  tooltip,
  description,
  isActive = false,
  loading = false,
  icon,
  disabled = false,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  className = '',
  style,
  ...rest
}) => {
  const store = useFloksFrnlStore();
  const { setInspectionText } = useBottomStrip();
  const generatedId = useId().replace(/[:/]/g, '');
  const componentId = id ?? `frnlButton.${label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId}`;

  const resolvedState = disabled
    ? 'disabled'
    : loading
    ? 'loading'
    : isActive
    ? 'active'
    : 'idle';

  const handlers = useMemo(
    () => ({
      'frnlButton.idle.click': (payload: unknown) => onClick?.(payload as any),
      'frnlButton.hover.click': (payload: unknown) => onClick?.(payload as any),
      'frnlButton.active.click': (payload: unknown) => onClick?.(payload as any),
      'frnlButton.disabled.click': () => {},
      'frnlButton.loading.click': () => {},
    }),
    [onClick]
  );

  const frnl = useFrnlComponent({
    id: componentId,
    definition: frnlButtonDefinition,
    store,
    state: resolvedState,
    properties: { variant, size, label, isActive, disabled, loading },
    handlers,
  });

  const handleHoverStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseEnter?.(e);
    const effLabel = label || tooltip || (typeof children === 'string' ? children : undefined);
    if (effLabel || description) {
      setInspectionText(effLabel || null, description || null);
    }
  };

  const handleHoverEnd = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(e);
    setInspectionText(null);
  };

  return (
    <button
      {...rest}
      id={componentId}
      type={rest.type ?? 'button'}
      disabled={disabled || loading}
      data-frnl-component="frnlButton"
      data-frnl-state={frnl.state}
      onClick={(e) => {
        if (disabled || loading) return;
        frnl.events.click(e);
      }}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onFocus={(e) => {
        onFocus?.(e);
        const effLabel = label || tooltip || (typeof children === 'string' ? children : undefined);
        if (effLabel || description) setInspectionText(effLabel || null, description || null);
      }}
      onBlur={(e) => {
        onBlur?.(e);
        setInspectionText(null);
      }}
      className={`inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider border rounded transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${SIZE_CLASSES[size]} ${className}`}
      style={{
        ...VARIANT_STYLES[variant],
        ...(isActive ? { borderColor: 'var(--skipo-accent, #38bdf8)', boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)' } : {}),
        ...style,
      }}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children ? <span>{children}</span> : label ? <span>{label}</span> : null}
    </button>
  );
};

frnlButton.displayName = 'frnlButton';
