/**
 * ASCII Architecture Flowchart: SigilRune
 *
 *   ┌──────────────────────────────────┐
 *   │       Initialize SigilRune       │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { SigilDiamondGroup } from './SigilDiamondGroup.js';
import { SigilGlyphGroup } from './SigilGlyphGroup.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface RingParam {
  name: string;
  value: number; // 0 to 10
  color?: string;
  isActive?: boolean;
}

export interface CategoryScores {
  reasoning?: number;
  coding?: number;
  data?: number;
  modality?: number;
}

export interface SigilRuneProps {
  sigilId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rings?: RingParam[];
  categoryCode?: 'REASONING' | 'CODING' | 'DATA' | 'MODALITY' | string;
  categoryScores?: CategoryScores;
  isDiamondLayout?: boolean;
  intensityMultiplier?: number;
  interactive?: boolean;
  className?: string;
}

// ════ SIGILRUNE IMPLEMENTATION ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const SigilRune: React.FC<SigilRuneProps> = ({
  sigilId = 'diamond-spec',
  size = 'md',
  rings = [],
  categoryCode,
  categoryScores,
  isDiamondLayout,
  intensityMultiplier = 1,
  className = ''
}) => {
  const pixelSizes = { xs: 36, sm: 54, md: 140, lg: 240, xl: 300 };
  const dim = pixelSizes[size] || 140;
  const center = dim / 2;
  const baseRadius = dim * 0.22;
  const ringStep = dim * 0.058;

  const useDiamond = isDiamondLayout || (isDiamondLayout !== false && !categoryCode);

  const scoreReasoning = categoryScores?.reasoning ?? (rings.find(r => r.name.toLowerCase().includes('reason'))?.value ?? 7);
  const scoreCoding = categoryScores?.coding ?? (rings.find(r => r.name.toLowerCase().includes('code'))?.value ?? 7);
  const scoreData = categoryScores?.data ?? (rings.find(r => r.name.toLowerCase().includes('data') || r.name.toLowerCase().includes('extract'))?.value ?? 7);
  const scoreModality = categoryScores?.modality ?? (rings.find(r => r.name.toLowerCase().includes('modal') || r.name.toLowerCase().includes('creat'))?.value ?? 7);

  const avgVal = (scoreReasoning + scoreCoding + scoreData + scoreModality) / 4;
  const overallEnergy = (avgVal / 10) * intensityMultiplier;

  const getThemeColor = () => {
    if (categoryCode === 'REASONING' || sigilId.includes('logic')) return 'var(--skipo-accent, #d4af37)';
    if (categoryCode === 'CODING' || sigilId.includes('code')) return 'var(--skipo-success, #2a9d8f)';
    if (categoryCode === 'DATA' || sigilId.includes('data')) return 'var(--skipo-warning, #f59e0b)';
    if (categoryCode === 'MODALITY' || sigilId.includes('creative') || sigilId.includes('vision')) return 'var(--skipo-accent-glow, #ec4899)';
    if (sigilId.includes('local')) return 'var(--skipo-success, #14b8a6)';
    if (sigilId.includes('agent')) return 'var(--skipo-accent, #8b5cf6)';
    return 'var(--skipo-warning, #f59e0b)';
  };

  const primaryColor = getThemeColor();
  const filterId = `sigil-glow-${sigilId.replace(/[^a-zA-Z0-9]/g, '')}-${size}`;

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="overflow-visible">
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={Math.max(2, dim * 0.02 * overallEnergy)} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={baseRadius + rings.length * ringStep + dim * 0.04}
          fill="none"
          stroke={primaryColor}
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity={0.25 * overallEnergy}
        />

        {rings.map((ring, idx) => {
          const r = baseRadius + idx * ringStep;
          const val = Math.max(0, Math.min(10, ring.value ?? 5));
          const ringRatio = val / 10;
          const ringColor = ring.color || primaryColor;
          const strokeOpacity = Math.max(0.18, ringRatio * 0.95);
          const strokeW = Math.max(1.2, (dim * 0.012) + (ringRatio * (dim * 0.016)));
          const circumference = 2 * Math.PI * r;
          const arcLength = circumference * (0.25 + 0.7 * ringRatio);
          const dashOffset = (idx % 2 === 0 ? 1 : -1) * (idx * 25);

          return (
            <g key={`${ring.name}-${idx}`}>
              <circle cx={center} cy={center} r={r} fill="none" stroke={ringColor} strokeWidth="1" strokeOpacity="0.15" strokeDasharray="3 3" />
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth={strokeW}
                strokeOpacity={strokeOpacity}
                strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{
                  transition: 'all 0.25s ease-out'
                }}
              />
            </g>
          );
        })}

        <g
          filter={`url(#${filterId})`}
          style={{
            transformOrigin: `${center}px ${center}px`
          }}
        >
          {useDiamond ? (
            <SigilDiamondGroup
              dim={dim}
              center={center}
              size={size}
              scoreReasoning={scoreReasoning}
              scoreCoding={scoreCoding}
              scoreData={scoreData}
              scoreModality={scoreModality}
            />
          ) : (
            <SigilGlyphGroup
              dim={dim}
              center={center}
              sigilId={sigilId}
              categoryCode={categoryCode}
              primaryColor={primaryColor}
            />
          )}
        </g>
      </svg>
    </div>
  );
};