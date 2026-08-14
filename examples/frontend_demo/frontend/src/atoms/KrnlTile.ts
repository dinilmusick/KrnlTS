import van from 'vanjs-core';

const { div, span } = van.tags;

export interface KrnlTileProps {
  label?: string;
  value?: any;
  subtitle?: string;
}

export function KrnlTile({ label: labelText, value, subtitle }: KrnlTileProps) {
  const valState = typeof value === 'object' && 'val' in value ? value : van.state(value);

  return div(
    { className: 'krnl-tile' },
    labelText ? span({ className: 'krnl-tile-title' }, labelText) : null,
    span({ className: 'krnl-tile-value' }, () => {
      const v = valState.val;
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v !== undefined && v !== null ? v : '—');
    }),
    subtitle ? span({ className: 'krnl-tile-subtitle' }, subtitle) : null
  );
}
