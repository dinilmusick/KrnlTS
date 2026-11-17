/**
 * ASCII Architecture Flowchart: useGalaxyPhysics
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize useGalaxyPhysics    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             nodesRef             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           particlesRef           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          draggedNodeRef          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { useRef, useEffect, useState } from 'react';
import { ApiKeyEntry, ProviderId, KeyModelFailure } from '../../../types/app.js';
import { StarNode, SubNode, Particle } from './types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface UseGalaxyPhysicsOptions {
  selectedModel?: string;
  selectedProvider: ProviderId | 'all' | string;
  keys: ApiKeyEntry[];
  nextKeyId?: string | null;
  permanentKeyId?: string | null;
  activeInFlightKeyId?: string | null;
  failedKeyIds?: string[];
  highlightedKeyId?: string | null;
  canvasRef?: any;
}


// ════ USEGALAXYPHYSICS IMPLEMENTATION ═════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function useGalaxyPhysics({
  selectedModel,
  selectedProvider,
  keys,
  nextKeyId,
  permanentKeyId,
  activeInFlightKeyId,
  failedKeyIds = [],
  highlightedKeyId
}: UseGalaxyPhysicsOptions) {
  const [nodes, setNodes] = useState<StarNode[]>([]);
  const nodesRef = useRef<StarNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const draggedNodeRef = useRef<StarNode | null>(null);

  useEffect(() => {
    const candidateKeys = selectedProvider === 'all' ? keys : keys.filter(k => k.providerId === selectedProvider);
    const count = candidateKeys.length;

    const updatedNodes: StarNode[] = candidateKeys.map((k, index) => {
      const existing = nodesRef.current.find(n => n.id === k.id);
      const angle = (index / Math.max(1, count)) * Math.PI * 2 + (existing ? 0 : Math.random() * 0.5);
      const dist = 110 + (index % 2) * 35;

      const starX = existing ? existing.x : 400 + Math.cos(angle) * dist;
      const starY = existing ? existing.y : 160 + Math.sin(angle) * dist;

      const rawFailedModels: string[] = k.failedModels || [];
      const failedModels: KeyModelFailure[] = rawFailedModels.map(mId => ({
        keyId: k.id,
        modelId: mId,
        providerId: k.providerId,
        failureCount: 1,
        penaltyPercent: 20,
        lastFailedAt: k.lastUsedAt,
        lastError: k.validationError
      }));
      const existingSub = existing?.subNodes?.[0];
      const subNodes: SubNode[] = failedModels.length > 0 ? [{
        id: `${k.id}-failed-cluster`,
        parentKeyId: k.id,
        modelId: failedModels.length === 1 ? failedModels[0].modelId : `${failedModels.length} FAULTED MODELS`,
        failureCount: failedModels.reduce((sum, f) => sum + (f.failureCount || 1), 0),
        penaltyPercent: Math.max(...failedModels.map(f => f.penaltyPercent || 20)),
        lastFailedAt: failedModels[0]?.lastFailedAt,
        lastError: failedModels[0]?.lastError,
        x: existingSub ? existingSub.x : starX + Math.cos(existingSub ? existingSub.orbitAngle : 0.78) * 32,
        y: existingSub ? existingSub.y : starY + Math.sin(existingSub ? existingSub.orbitAngle : 0.78) * 32,
        vx: existingSub ? existingSub.vx : 0,
        vy: existingSub ? existingSub.vy : 0,
        orbitAngle: existingSub ? existingSub.orbitAngle : 0.78,
        orbitDist: 32,
        orbitSpeed: 0.012,
        radius: failedModels.length > 1 ? 9.5 : 8,
        allFailures: failedModels,
        totalFailedCount: failedModels.length
      }] : [];

      return {
        id: k.id,
        label: k.label,
        providerId: k.providerId,
        x: starX,
        y: starY,
        vx: existing ? existing.vx : (Math.random() - 0.5) * 0.3,
        vy: existing ? existing.vy : (Math.random() - 0.5) * 0.3,
        radius: k.id === activeInFlightKeyId ? 15 : k.id === nextKeyId ? 13 : 11,
        baseColor: '#38BDF8',
        totalCalls: k.totalCalls || 0,
        successfulCalls: k.successfulCalls || 0,
        failedCalls: k.failedCalls || 0,
        latencyMs: k.lastLatencyMs || 35,
        status: k.status,
        weight: k.weight || 10,
        isNext: k.id === nextKeyId,
        isPermanent: k.id === permanentKeyId,
        isActiveInFlight: k.id === activeInFlightKeyId,
        isFailed: failedKeyIds.includes(k.id) || k.status === 'rate-limited' || k.status === 'invalid',
        isHighlighted: k.id === highlightedKeyId,
        glowProgress: k.id === activeInFlightKeyId ? 1 : 0,
        failedModels,
        subNodes
      };
    });

    nodesRef.current = updatedNodes;
    setNodes(updatedNodes);
  }, [selectedProvider, keys, nextKeyId, permanentKeyId, activeInFlightKeyId, failedKeyIds, highlightedKeyId, selectedModel]);

  return {
    nodes,
    nodesRef,
    particlesRef,
    draggedNodeRef,
    isRunning: true
  };
}