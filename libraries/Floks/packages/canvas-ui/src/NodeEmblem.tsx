'use client';

export interface NodeEmblemProps {
  type: string;
  size?: number;
}

export function NodeEmblem({ type, size = 38 }: NodeEmblemProps) {
  const t = (type || '').toLowerCase();
  const strokeWidth = 1.8;

  if (t.includes('entity') || t.includes('system')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--skipo-accent, #d4af37)" strokeWidth={strokeWidth}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  }
  if (t.includes('func') || t.includes('logic')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--skipo-accent, #61afef)" strokeWidth={strokeWidth}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  if (t.includes('data') || t.includes('state') || t.includes('db')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#98c379" strokeWidth={strokeWidth}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    );
  }
  if (t.includes('number') || t.includes('math')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--skipo-accent, #61afef)" strokeWidth={strokeWidth}>
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="14" y2="21" />
      </svg>
    );
  }
  if (t.includes('string') || t.includes('text')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#98c379" strokeWidth={strokeWidth}>
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    );
  }
  if (t.includes('bool') || t.includes('toggle')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e5c07b" strokeWidth={strokeWidth}>
        <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
        <circle cx="16" cy="12" r="3" fill="#e5c07b" />
      </svg>
    );
  }
  if (t.includes('vector') || t.includes('vec')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#56b6c2" strokeWidth={strokeWidth}>
        <path d="M5 19L19 5" />
        <polyline points="9 5 19 5 19 15" />
      </svg>
    );
  }
  if (t.includes('color')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e06c75" strokeWidth={strokeWidth}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    );
  }
  if (t.includes('display') || t.includes('view') || t.includes('out')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#c678dd" strokeWidth={strokeWidth}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--skipo-accent, #61afef)" strokeWidth={strokeWidth}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
