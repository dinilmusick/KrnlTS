'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ButtonVariant = 'ghost' | 'primary' | 'secondary' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

type SkipoThemeStyle = React.CSSProperties & Record<`--${string}`, string | number>;

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

interface BottomStripContextValue {
  inspectionText: string | null;
  setInspectionText: (label: string | null, description?: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => undefined,
  toggleTheme: () => undefined,
});

const BottomStripContext = createContext<BottomStripContextValue>({
  inspectionText: null,
  setInspectionText: () => undefined,
});

const themeTokens: Record<ThemeMode, SkipoThemeStyle> = {
  dark: {
    '--skipo-bg': '#16181d',
    '--skipo-surface': '#20242b',
    '--skipo-surface-hover': '#292e37',
    '--skipo-matte-bg': '#111318',
    '--skipo-matte-bg-hover': '#181b21',
    '--skipo-text': '#f1f5f9',
    '--skipo-text-muted': '#94a3b8',
    '--skipo-border-color': '#3b4250',
    '--skipo-border': '2px solid #3b4250',
    '--skipo-border-input': '2px solid #3b4250',
    '--skipo-accent': '#d4af37',
    '--skipo-accent-fg': '#111318',
    '--skipo-danger': '#ef4444',
    '--skipo-danger-fg': '#ffffff',
    '--skipo-success': '#22c55e',
    '--skipo-success-fg': '#07130b',
    '--skipo-warning': '#f59e0b',
    '--skipo-warning-fg': '#17100a',
    '--skipo-info': '#38bdf8',
    '--skipo-info-fg': '#06131a',
    '--skipo-radius': '2px',
    '--skipo-radius-sm': '2px',
    '--skipo-radius-lg': '4px',
    '--skipo-shadow': '3px 3px 0 rgba(0,0,0,.45)',
    '--skipo-shadow-btn': '2px 2px 0 rgba(0,0,0,.45)',
    '--skipo-shadow-btn-active': '0 0 0 rgba(0,0,0,0)',
    '--skipo-shadow-hover': '4px 4px 0 rgba(0,0,0,.45)',
    '--skipo-accent-glow': '0 0 12px rgba(212,175,55,.2)',
  },
  light: {
    '--skipo-bg': '#f5f7fa',
    '--skipo-surface': '#ffffff',
    '--skipo-surface-hover': '#eef1f5',
    '--skipo-matte-bg': '#e8ecf1',
    '--skipo-matte-bg-hover': '#dde3ea',
    '--skipo-text': '#111827',
    '--skipo-text-muted': '#64748b',
    '--skipo-border-color': '#334155',
    '--skipo-border': '2px solid #334155',
    '--skipo-border-input': '2px solid #64748b',
    '--skipo-accent': '#9a7612',
    '--skipo-accent-fg': '#ffffff',
    '--skipo-danger': '#dc2626',
    '--skipo-danger-fg': '#ffffff',
    '--skipo-success': '#15803d',
    '--skipo-success-fg': '#ffffff',
    '--skipo-warning': '#b45309',
    '--skipo-warning-fg': '#ffffff',
    '--skipo-info': '#0369a1',
    '--skipo-info-fg': '#ffffff',
    '--skipo-radius': '2px',
    '--skipo-radius-sm': '2px',
    '--skipo-radius-lg': '4px',
    '--skipo-shadow': '3px 3px 0 rgba(15,23,42,.16)',
    '--skipo-shadow-btn': '2px 2px 0 rgba(15,23,42,.16)',
    '--skipo-shadow-btn-active': '0 0 0 rgba(0,0,0,0)',
    '--skipo-shadow-hover': '4px 4px 0 rgba(15,23,42,.16)',
    '--skipo-accent-glow': '0 0 12px rgba(154,118,18,.18)',
  },
};

export function SkipoThemeProvider({ children, defaultTheme = 'dark' }: { children: React.ReactNode; defaultTheme?: ThemeMode }) {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme);
  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={theme} data-skipo-theme={theme} className={theme === 'dark' ? 'dark' : ''} style={themeTokens[theme]}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useSkipoTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function BottomStripProvider({ children }: { children: React.ReactNode }) {
  const [inspectionText, setInspectionState] = useState<string | null>(null);
  const setInspectionText = (label: string | null, description?: string | null) => {
    if (!label) {
      setInspectionState(null);
      return;
    }
    setInspectionState(description ? `${label}: ${description}` : label);
  };
  const value = useMemo(() => ({ inspectionText, setInspectionText }), [inspectionText]);

  return <BottomStripContext.Provider value={value}>{children}</BottomStripContext.Provider>;
}

export function useBottomStrip(): BottomStripContextValue {
  return useContext(BottomStripContext);
}

export interface BottomStripProps extends React.HTMLAttributes<HTMLDivElement> {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function BottomStrip({ leftSlot, rightSlot, className = '', children, ...props }: BottomStripProps) {
  const { inspectionText } = useBottomStrip();

  return (
    <footer
      {...props}
      className={`flex min-h-8 items-center justify-between gap-3 border-t px-2 py-1 text-xs ${className}`}
      style={{
        borderColor: 'var(--skipo-border-color)',
        backgroundColor: 'var(--skipo-surface)',
        color: 'var(--skipo-text)',
        ...props.style,
      }}
    >
      <div className="min-w-0 flex-1">{leftSlot}</div>
      <div className="min-w-0 flex-1 truncate text-center text-[10px] font-mono" style={{ color: 'var(--skipo-text-muted)' }}>
        {inspectionText || children}
      </div>
      <div className="min-w-0 flex-1 text-right">{rightSlot}</div>
    </footer>
  );
}

export interface AppShellProps {
  id?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function AppShell({ id, header, footer, className = '', children }: AppShellProps) {
  return (
    <div id={id} className={`flex min-h-full flex-1 flex-col ${className}`}>
      {header}
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      {footer}
    </div>
  );
}

export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-7 px-2 text-[10px]',
  md: 'min-h-8 px-3 text-xs',
  lg: 'min-h-10 px-4 text-sm',
};

export function BaseButton({ variant = 'secondary', size = 'md', className = '', style, ...props }: BaseButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center ${buttonSizeClasses[size]} ${className}`}
      data-variant={variant}
      data-size={size}
      style={style}
    />
  );
}

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function BaseCard({ interactive = false, className = '', ...props }: BaseCardProps) {
  return (
    <div
      {...props}
      data-interactive={interactive || undefined}
      className={`block ${interactive ? 'cursor-pointer' : ''} ${className}`}
    />
  );
}

export const BaseTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function BaseTextarea(props, ref) {
    return <textarea ref={ref} {...props} />;
  },
);

export const BaseInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function BaseInput(props, ref) {
    return <input ref={ref} {...props} />;
  },
);

export function BaseToggle({
  checked,
  onChange,
  label,
  className = '',
}: {
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  label?: string;
  className?: string;
}) {
  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
