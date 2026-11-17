// ════ GRAPHMANAGER EXTRACTED HELPERS ══════════════════════════════════════════════
import { SpaceNode, NodeConnection, EffectNode, EffectType, SignalType } from "../../types/index.js";
import { getNodeOutputSignalType } from '../canonicalSignalTable';
import { GraphIssue, GraphValidationResult, WireSpatialIntersection } from './types';

/**
 * Calculates Euclidean distance from a 3D effect sphere center to a wire segment.
 * Scaled Y weighting (0.4) allows hovering orbs to comfortably envelop ground-laid conduits.
 */
export function getDistanceToWireSegment(
  spherePos: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  controlPoint?: [number, number, number]
): { distance: number; closestPoint: [number, number, number]; t: number } {
  if (controlPoint) {
    const res1 = getDistanceToWireSegment(spherePos, p1, controlPoint);
    const res2 = getDistanceToWireSegment(spherePos, controlPoint, p2);
    return res1.distance < res2.distance ? res1 : res2;
  }

  const sx = spherePos[0];
  const sy = spherePos[1] || 0;
  const sz = spherePos[2];

  const x1 = p1[0], y1 = p1[1] || 0, z1 = p1[2];
  const x2 = p2[0], y2 = p2[1] || 0, z2 = p2[2];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dy * dy + dz * dz;

  let t = 0;
  if (lenSq > 0.00001) {
    t = ((sx - x1) * dx + (sy - y1) * dy + (sz - z1) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }

  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const cz = z1 + t * dz;

  const distDx = sx - cx;
  const distDy = (sy - cy) * 0.63; // 0.63^2 ≈ 0.4 Y weighting
  const distDz = sz - cz;

  const distance = Math.sqrt(distDx * distDx + distDy * distDy + distDz * distDz);

  return { distance, closestPoint: [cx, cy, cz], t };
}

export function areSignalTypesCompatibleForEffect(
  effectSignal: SignalType,
  wireSignal: SignalType,
  effectType?: EffectType
): boolean {
  if (effectSignal === wireSignal) return true;

  const isAudioEffect =
    effectSignal === 'audio' ||
    effectSignal === 'audio_mono' ||
    effectSignal === 'audio_stereo';
  const isAudioWire =
    wireSignal === 'audio' ||
    wireSignal === 'audio_mono' ||
    wireSignal === 'audio_stereo';

  if (isAudioEffect && isAudioWire) return true;

  return false;
}

export function isWireAffectedByEffect(
  effect: EffectNode,
  conn: NodeConnection,
  fromNode: SpaceNode,
  toNode: SpaceNode
): boolean {
  if (!effect.active) return false;
  if (effect.id === fromNode.id || effect.id === toNode.id) return false;

  const wireSignal = conn.signalType || getNodeOutputSignalType(fromNode);
  const effectSignal =
    effect.signalType ||
    (effect.effectType === 'gain'
      ? 'audio'
      : effect.effectType === 'pan'
      ? 'audio_stereo'
      : effect.effectType === 'velocity'
      ? 'midi'
      : 'trigger');

  // An effect of signal type A will affect wires with compatible signal protocol
  if (!areSignalTypesCompatibleForEffect(effectSignal, wireSignal, effect.effectType)) {
    return false;
  }

  const { distance } = getDistanceToWireSegment(effect.position, fromNode.position, toNode.position, conn.controlPoint);
  return distance <= (effect.radius || 6.0);
}
