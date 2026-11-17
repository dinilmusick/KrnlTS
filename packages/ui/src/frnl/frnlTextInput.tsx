// ══════════════════════════════════════════════════════════════════════════════
// FLOKS CANONICAL FRNL TEXT INPUT (frnlTextInput)
// Direct FrnlTS-backed form text field with hover inspection and validation
// ══════════════════════════════════════════════════════════════════════════════
import React, { useId, useMemo } from 'react';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from './store.js';
import { useBottomStrip } from '../components/bottom-strip/index.js';
import { createDefaultFrnlInputContract, resolveFrnlInput, useFrnlSemanticInputContext, type FrnlInputContract, type FrnlResolvedInput } from '@ultrst-armada/frnlts';

export interface FrnlTextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  id?: string;
  label?: string;
  description?: string;
  error?: string | boolean;
  size?: 'sm' | 'md' | 'lg';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onClear?: () => void;
  /** undefined = framework auto contract; null = explicitly disable semantic resolution. */
  semanticInput?: FrnlInputContract<any> | null;
  onSemanticValue?: (value: any, rawInput?: string) => void;
  onSemanticResult?: (result: FrnlResolvedInput<any>) => void;
}

export const frnlTextInputDefinition = defineFrnlComponent({
  name: 'frnlTextInput',
  states: {
    idle: {
      name: 'idle',
      events: {
        change: { functionId: 'frnlTextInput.idle.change' },
        focus: { functionId: 'frnlTextInput.idle.focus' },
        blur: { functionId: 'frnlTextInput.idle.blur' },
      },
      visualParameters: { borderColor: 'var(--skipo-border-subtle, #334155)' },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    focused: {
      name: 'focused',
      events: {
        change: { functionId: 'frnlTextInput.focused.change' },
        blur: { functionId: 'frnlTextInput.focused.blur' },
      },
      visualParameters: { borderColor: 'var(--skipo-accent, #38bdf8)' },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    error: {
      name: 'error',
      events: {
        change: { functionId: 'frnlTextInput.error.change' },
      },
      visualParameters: { borderColor: '#ef4444' },
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

export const frnlTextInput: React.FC<FrnlTextInputProps> = ({
  id,
  label,
  description,
  error,
  size = 'md',
  leadingIcon,
  trailingIcon,
  onClear,
  semanticInput,
  onSemanticValue,
  onSemanticResult,
  disabled = false,
  value,
  name,
  type = 'text',
  onChange,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  className = '',
  style,
  ...rest
}) => {
  const store = useFloksFrnlStore();
  const semanticContext = useFrnlSemanticInputContext();
  const { setInspectionText } = useBottomStrip();
  const generatedId = useId().replace(/[:/]/g, '');
  const componentId = id ?? `frnlTextInput.${label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId}`;
  const effectiveSemanticInput = useMemo(() => {
    if (semanticInput === null) return undefined;
    return semanticInput ?? createDefaultFrnlInputContract({
      name: name ?? componentId,
      label: label ?? name ?? componentId,
      description,
      inputType: type,
      context: semanticContext,
    });
  }, [semanticInput, name, componentId, label, description, type, semanticContext]);

  const resolvedState = disabled
    ? 'disabled'
    : error
    ? 'error'
    : 'idle';

  const handlers = useMemo(
    () => ({
      'frnlTextInput.idle.change': (payload: unknown) => onChange?.(payload as any),
      'frnlTextInput.idle.focus': (payload: unknown) => onFocus?.(payload as any),
      'frnlTextInput.idle.blur': (payload: unknown) => onBlur?.(payload as any),
      'frnlTextInput.focused.change': (payload: unknown) => onChange?.(payload as any),
      'frnlTextInput.focused.blur': (payload: unknown) => onBlur?.(payload as any),
      'frnlTextInput.error.change': (payload: unknown) => onChange?.(payload as any),
    }),
    [onChange, onFocus, onBlur]
  );

  const frnl = useFrnlComponent({
    id: componentId,
    definition: frnlTextInputDefinition,
    store,
    state: resolvedState,
    properties: { label, error: Boolean(error), disabled },
    handlers,
  });

  const handleHover = (e: React.MouseEvent<HTMLInputElement>) => {
    onMouseEnter?.(e);
    if (label || description) {
      setInspectionText(label || null, description || null);
    }
  };

  const handleSemanticBlur = async () => {
    if (!effectiveSemanticInput || typeof value !== 'string' || !value.trim()) return;
    const result = await resolveFrnlInput(effectiveSemanticInput, value, semanticContext);
    onSemanticResult?.(result);
    if (result && result.status === 'resolved' && result.value !== undefined) {
      onSemanticValue?.(result.value, result.rawInput);
      const strVal = typeof result.value === 'string' ? result.value : String(result.value);
      if (strVal !== value) {
        const syntheticEvent = { target: { value: strVal } } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      }
    }
  };

  const handleLeave = (e: React.MouseEvent<HTMLInputElement>) => {
    onMouseLeave?.(e);
    setInspectionText(null);
  };

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
      <div
        className={`relative flex items-center border rounded transition-colors bg-[var(--skipo-bg-panel,#0f172a)] ${
          error ? 'border-rose-500' : 'border-[var(--skipo-border-subtle,#334155)] focus-within:border-[var(--skipo-accent,#38bdf8)]'
        }`}
        style={style}
      >
        {leadingIcon && (
          <span className="pl-2.5 text-[var(--skipo-text-muted,#94a3b8)] flex items-center justify-center shrink-0">
            {leadingIcon}
          </span>
        )}
        <input
          {...rest}
          id={componentId}
          name={name}
          type={type}
          value={value}
          disabled={disabled}
          data-frnl-component="frnlTextInput"
          data-semantic-input={effectiveSemanticInput ? 'true' : 'false'}
          data-frnl-state={frnl.state}
          onChange={(e) => {
            onChange?.(e);
            frnl.events.change?.(e);
          }}
          onFocus={(e) => {
            onFocus?.(e);
            frnl.events.focus?.(e);
            if (label || description) setInspectionText(label || null, description || null);
          }}
          onBlur={(e) => {
            onBlur?.(e);
            void handleSemanticBlur();
            frnl.events.blur?.(e);
            setInspectionText(null);
          }}
          onMouseEnter={handleHover}
          onMouseLeave={handleLeave}
          className={`w-full bg-transparent px-3 py-1 text-[var(--skipo-text-primary,#f8fafc)] focus:outline-none placeholder-[var(--skipo-text-muted,#64748b)] disabled:opacity-40 disabled:cursor-not-allowed ${heightClass}`}
        />
        {trailingIcon && (
          <span className="pr-2.5 text-[var(--skipo-text-muted,#94a3b8)] flex items-center justify-center shrink-0">
            {trailingIcon}
          </span>
        )}
        {onClear && value && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="pr-2.5 text-[var(--skipo-text-muted,#94a3b8)] hover:text-white cursor-pointer"
            aria-label="Clear Input"
          >
            ×
          </button>
        )}
      </div>
      {typeof error === 'string' && (
        <span className="text-[10px] text-rose-400 font-semibold">{error}</span>
      )}
    </div>
  );
};

frnlTextInput.displayName = 'frnlTextInput';
