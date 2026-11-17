/**
 * ASCII Architecture Flowchart: SigilGlyphGroup
 *
 *   ┌──────────────────────────────────┐
 *   │    Render Single SVG Rune Glyph  │
 *   └──────────────────────────────────┘
 */

import React from 'react';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface SigilGlyphGroupProps {
  dim: number;
  center: number;
  sigilId: string;
  categoryCode?: string;
  primaryColor: string;
}

// ════ SIGILGLYPHGROUP IMPLEMENTATION ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const SigilGlyphGroup: React.FC<SigilGlyphGroupProps> = ({
  dim,
  center,
  sigilId,
  categoryCode,
  primaryColor
}) => {
  const s = dim * 0.26;
  const half = s / 2;

  if (sigilId.includes('logic') || categoryCode === 'REASONING') {
    return (
      <g stroke={primaryColor} strokeWidth={Math.max(1.8, dim * 0.016)} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polygon points={`${center},${center - half} ${center + half * 0.866},${center + half * 0.5} ${center - half * 0.866},${center + half * 0.5}`} />
        <polygon points={`${center},${center + half} ${center + half * 0.866},${center - half * 0.5} ${center - half * 0.866},${center - half * 0.5}`} opacity="0.6" />
        <line x1={center} y1={center - half * 1.3} x2={center} y2={center + half * 1.3} />
        <circle cx={center} cy={center} r={dim * 0.04} fill={primaryColor} />
      </g>
    );
  }

  if (sigilId.includes('code') || categoryCode === 'CODING') {
    return (
      <g stroke={primaryColor} strokeWidth={Math.max(1.8, dim * 0.016)} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x={center - half * 0.75} y={center - half * 0.75} width={s * 0.75} height={s * 0.75} transform={`rotate(45 ${center} ${center})`} />
        <line x1={center - half} y1={center} x2={center + half} y2={center} />
        <line x1={center - half} y1={center - half} x2={center} y2={center + half} />
        <circle cx={center - half * 0.5} cy={center} r={dim * 0.025} fill={primaryColor} />
        <circle cx={center + half * 0.5} cy={center} r={dim * 0.025} fill={primaryColor} />
        <circle cx={center} cy={center} r={dim * 0.035} fill={primaryColor} />
      </g>
    );
  }

  if (sigilId.includes('data') || categoryCode === 'DATA') {
    return (
      <g stroke={primaryColor} strokeWidth={Math.max(1.8, dim * 0.016)} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx={center} cy={center} r={half * 0.6} />
        <polygon points={`${center},${center - half * 0.9} ${center + half * 0.9},${center + half * 0.7} ${center - half * 0.9},${center + half * 0.7}`} />
        <line x1={center - half * 0.7} y1={center - half * 0.3} x2={center + half * 0.7} y2={center - half * 0.3} />
        <line x1={center - half * 0.7} y1={center + half * 0.2} x2={center + half * 0.7} y2={center + half * 0.2} />
        <circle cx={center} cy={center} r={dim * 0.03} fill={primaryColor} />
      </g>
    );
  }

  if (sigilId.includes('creative') || categoryCode === 'MODALITY') {
    return (
      <g stroke={primaryColor} strokeWidth={Math.max(1.8, dim * 0.016)} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${center} ${center - half} Q ${center + half * 0.5} ${center - half * 0.5} ${center + half} ${center} Q ${center + half * 0.5} ${center + half * 0.5} ${center} ${center + half} Q ${center - half * 0.5} ${center + half * 0.5} ${center - half} ${center} Q ${center - half * 0.5} ${center - half * 0.5} ${center} ${center - half} Z`} />
        <line x1={center} y1={center - half * 1.1} x2={center} y2={center + half * 1.1} />
        <line x1={center - half * 1.1} y1={center} x2={center + half * 1.1} y2={center} />
        <circle cx={center} cy={center} r={dim * 0.045} fill={primaryColor} />
      </g>
    );
  }

  if (sigilId.includes('vision')) {
    return (
      <g stroke={primaryColor} strokeWidth={Math.max(1.8, dim * 0.016)} fill="none" strokeLinecap="round">
        <path d={`M ${center - half * 1.1} ${center} Q ${center} ${center - half * 0.9} ${center + half * 1.1} ${center} Q ${center} ${center + half * 0.9} ${center - half * 1.1} ${center} Z`} />
        <circle cx={center} cy={center} r={half * 0.45} />
        <circle cx={center} cy={center} r={dim * 0.035} fill={primaryColor} />
      </g>
    );
  }

  if (sigilId.includes('agent')) {
    return (
      <g stroke={primaryColor} strokeWidth={Math.max(1.8, dim * 0.016)} fill="none">
        <ellipse cx={center} cy={center} rx={half * 0.9} ry={half * 0.35} transform={`rotate(-30 ${center} ${center})`} />
        <ellipse cx={center} cy={center} rx={half * 0.9} ry={half * 0.35} transform={`rotate(30 ${center} ${center})`} />
        <circle cx={center} cy={center} r={dim * 0.04} fill={primaryColor} />
      </g>
    );
  }

  if (sigilId.includes('local')) {
    return (
      <g stroke={primaryColor} strokeWidth={Math.max(1.8, dim * 0.016)} fill="none" strokeLinecap="round">
        <polygon points={`${center},${center - half * 0.8} ${center + half * 0.8},${center + half * 0.8} ${center - half * 0.8},${center + half * 0.8}`} />
        <line x1={center} y1={center - half * 0.8} x2={center} y2={center + half * 0.8} />
        <circle cx={center} cy={center + half * 0.1} r={dim * 0.035} fill={primaryColor} />
      </g>
    );
  }

  return (
    <g stroke={primaryColor} strokeWidth={Math.max(1.8, dim * 0.016)} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx={center} cy={center} r={half * 0.85} />
      <polygon points={`${center},${center - half * 0.75} ${center + half * 0.65},${center + half * 0.4} ${center - half * 0.65},${center + half * 0.4}`} />
      <circle cx={center} cy={center} r={dim * 0.04} fill={primaryColor} />
    </g>
  );
};