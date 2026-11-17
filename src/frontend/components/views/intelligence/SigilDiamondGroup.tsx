/**
 * ASCII Architecture Flowchart: SigilDiamondGroup
 *
 *   ┌──────────────────────────────────┐
 *   │    Render 4-Sigil Diamond Spec   │
 *   └──────────────────────────────────┘
 */

import React from 'react';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface SigilDiamondGroupProps {
  dim: number;
  center: number;
  size: string;
  scoreReasoning: number;
  scoreCoding: number;
  scoreData: number;
  scoreModality: number;
}

// ════ SIGILDIAMONDGROUP IMPLEMENTATION ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const SigilDiamondGroup: React.FC<SigilDiamondGroupProps> = ({
  dim,
  center,
  size,
  scoreReasoning,
  scoreCoding,
  scoreData,
  scoreModality
}) => {
  const offset = dim * 0.28;
  const cornerSize = dim * 0.17;
  const half = cornerSize / 2;
  const sw = Math.max(1.1, dim * 0.016);

  const top = { x: center, y: center - offset, color: 'var(--skipo-accent, #d4af37)', score: scoreReasoning };
  const right = { x: center + offset, y: center, color: 'var(--skipo-success, #2a9d8f)', score: scoreCoding };
  const bottom = { x: center, y: center + offset, color: 'var(--skipo-warning, #f59e0b)', score: scoreData };
  const left = { x: center - offset, y: center, color: 'var(--skipo-accent-glow, #ec4899)', score: scoreModality };

  return (
    <g className="diamond-spec-group">
      <polygon
        points={`${top.x},${top.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`}
        fill="var(--skipo-matte-bg, #0f172a)"
        stroke="var(--skipo-accent, #818cf8)"
        strokeWidth={Math.max(1.2, dim * 0.014)}
        strokeDasharray={size === 'xs' ? 'none' : '3 2'}
        opacity="0.8"
      />
      <polygon
        points={`${center},${center - offset * 0.55} ${center + offset * 0.55},${center} ${center},${center + offset * 0.55} ${center - offset * 0.55},${center}`}
        fill="none"
        stroke="var(--skipo-warning, #f59e0b)"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.5"
      />
      <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="var(--skipo-accent, #d4af37)" strokeWidth="1" opacity="0.35" strokeDasharray="2 3" />
      <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="var(--skipo-success, #2a9d8f)" strokeWidth="1" opacity="0.35" strokeDasharray="2 3" />
      <circle cx={center} cy={center} r={dim * 0.045} fill="var(--skipo-warning, #f59e0b)" opacity="0.9" />

      <g opacity={Math.max(0.4, top.score / 10)}>
        <circle cx={top.x} cy={top.y} r={half * 1.15} fill="var(--skipo-surface, #0f172a)" stroke={top.color} strokeWidth={sw} />
        <polygon points={`${top.x},${top.y - half * 0.8} ${top.x + half * 0.7},${top.y + half * 0.4} ${top.x - half * 0.7},${top.y + half * 0.4}`} stroke={top.color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={top.x} y1={top.y - half * 0.9} x2={top.x} y2={top.y + half * 0.9} stroke={top.color} strokeWidth={sw} strokeLinecap="round" />
        <circle cx={top.x} cy={top.y} r={dim * 0.02} fill={top.color} />
      </g>

      <g opacity={Math.max(0.4, right.score / 10)}>
        <circle cx={right.x} cy={right.y} r={half * 1.15} fill="var(--skipo-surface, #0f172a)" stroke={right.color} strokeWidth={sw} />
        <rect x={right.x - half * 0.5} y={right.y - half * 0.5} width={cornerSize * 0.5} height={cornerSize * 0.5} transform={`rotate(45 ${right.x} ${right.y})`} stroke={right.color} strokeWidth={sw} fill="none" />
        <line x1={right.x - half * 0.7} y1={right.y} x2={right.x + half * 0.7} y2={right.y} stroke={right.color} strokeWidth={sw} strokeLinecap="round" />
        <line x1={right.x} y1={right.y - half * 0.7} x2={right.x} y2={right.y + half * 0.7} stroke={right.color} strokeWidth={sw} strokeLinecap="round" />
        <circle cx={right.x} cy={right.y} r={dim * 0.02} fill={right.color} />
      </g>

      <g opacity={Math.max(0.4, bottom.score / 10)}>
        <circle cx={bottom.x} cy={bottom.y} r={half * 1.15} fill="var(--skipo-surface, #0f172a)" stroke={bottom.color} strokeWidth={sw} />
        <polygon points={`${bottom.x},${bottom.y - half * 0.7} ${bottom.x + half * 0.7},${bottom.y + half * 0.5} ${bottom.x - half * 0.7},${bottom.y + half * 0.5}`} stroke={bottom.color} strokeWidth={sw} fill="none" strokeLinecap="round" />
        <line x1={bottom.x - half * 0.5} y1={bottom.y - half * 0.1} x2={bottom.x + half * 0.5} y2={bottom.y - half * 0.1} stroke={bottom.color} strokeWidth={sw} strokeLinecap="round" />
        <circle cx={bottom.x} cy={bottom.y} r={dim * 0.02} fill={bottom.color} />
      </g>

      <g opacity={Math.max(0.4, left.score / 10)}>
        <circle cx={left.x} cy={left.y} r={half * 1.15} fill="var(--skipo-surface, #0f172a)" stroke={left.color} strokeWidth={sw} />
        <path d={`M ${left.x} ${left.y - half * 0.8} Q ${left.x + half * 0.4} ${left.y - half * 0.4} ${left.x + half * 0.8} ${left.y} Q ${left.x + half * 0.4} ${left.y + half * 0.4} ${left.x} ${left.y + half * 0.8} Q ${left.x - half * 0.4} ${left.y + half * 0.4} ${left.x - half * 0.8} ${left.y} Q ${left.x - half * 0.4} ${left.y - half * 0.4} ${left.x} ${left.y - half * 0.8} Z`} stroke={left.color} strokeWidth={sw} fill="none" />
        <line x1={left.x} y1={left.y - half * 0.8} x2={left.x} y2={left.y + half * 0.8} stroke={left.color} strokeWidth={sw} strokeLinecap="round" />
        <line x1={left.x - half * 0.8} y1={left.y} x2={left.x + half * 0.8} stroke={left.color} strokeWidth={sw} strokeLinecap="round" />
        <circle cx={left.x} cy={left.y} r={dim * 0.02} fill={left.color} />
      </g>
    </g>
  );
};