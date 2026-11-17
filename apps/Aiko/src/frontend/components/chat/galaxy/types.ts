/**
// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

 * ASCII Architecture Flowchart: galaxy types
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize Galaxy Types     │
 *   └──────────────────────────────────┘
 */

import { ProviderId, ApiKeyEntry, KeyModelFailure } from '../../../types/app.js';

export interface SubNode {
  id: string;
  parentKeyId: string;
  modelId: string;
  failureCount: number;
  penaltyPercent: number;
  lastFailedAt?: string;
  lastError?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  orbitAngle: number;
  orbitDist: number;
  orbitSpeed: number;
  radius: number;
  isHovered?: boolean;
  isSelected?: boolean;
  allFailures?: KeyModelFailure[];
  totalFailedCount?: number;
}

export interface StarNode {
  id: string;
  label: string;
  providerId: ProviderId;
  type?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseColor: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  latencyMs: number | null;
  status: ApiKeyEntry['status'];
  weight: number;
  isNext: boolean;
  isPermanent?: boolean;
  isActiveInFlight: boolean;
  isFailed: boolean;
  isHighlighted: boolean;
  isSelected?: boolean;
  glowProgress: number;
  failedModels?: KeyModelFailure[];
  subNodes: SubNode[];
  isHovered?: boolean;
  isDragging?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha?: number;
  targetX?: number;
  targetY?: number;
}

export interface ContextMenuState {
  x: number;
  y: number;
  node: StarNode;
}