import { CurveTrackData, CurvePoint, SpaceNode, ContainerNode } from '@kloks/state-graph';
import { synthEngine } from './synthEngine';

export class CurveEngine {
  public evaluateCurve(curve: CurveTrackData, currentBeat: number): number {
    const len = curve.lengthInBeats || 4;
    const normBeat = ((currentBeat % len) + len) % len;
    const pts = [...curve.points].sort((a, b) => a.x - b.x);

    if (pts.length === 0) return 0.5;
    if (pts.length === 1) return pts[0].y;

    // Boundary conditions
    if (normBeat <= pts[0].x) return pts[0].y;
    if (normBeat >= pts[pts.length - 1].x) return pts[pts.length - 1].y;

    // Find bounding segments
    let p0 = pts[0];
    let p1 = pts[pts.length - 1];
    for (let i = 0; i < pts.length - 1; i++) {
      if (normBeat >= pts[i].x && normBeat <= pts[i + 1].x) {
        p0 = pts[i];
        p1 = pts[i + 1];
        break;
      }
    }

    const span = p1.x - p0.x;
    if (span <= 0.0001) return p0.y;
    const t = (normBeat - p0.x) / span; // 0 to 1

    const tension = p0.tension || 0; // -1 to +1
    let curvedT = t;
    if (tension > 0) {
      curvedT = Math.pow(t, 1 + tension * 3);
    } else if (tension < 0) {
      curvedT = 1 - Math.pow(1 - t, 1 + Math.abs(tension) * 3);
    }

    return p0.y + (p1.y - p0.y) * curvedT;
  }

  public generatePresetPoints(
    type: 'sine' | 'triangle' | 'saw_up' | 'saw_down' | 'exp_rise' | 'exp_fall' | 'step',
    lengthInBeats: number
  ): CurvePoint[] {
    const len = lengthInBeats || 4;
    switch (type) {
      case 'sine':
        return [
          { id: 'pt-0', x: 0, y: 0.5, tension: 0 },
          { id: 'pt-1', x: len * 0.25, y: 1.0, tension: 0 },
          { id: 'pt-2', x: len * 0.5, y: 0.5, tension: 0 },
          { id: 'pt-3', x: len * 0.75, y: 0.0, tension: 0 },
          { id: 'pt-4', x: len, y: 0.5, tension: 0 },
        ];
      case 'triangle':
        return [
          { id: 'pt-0', x: 0, y: 0.0, tension: 0 },
          { id: 'pt-1', x: len * 0.5, y: 1.0, tension: 0 },
          { id: 'pt-2', x: len, y: 0.0, tension: 0 },
        ];
      case 'saw_up':
        return [
          { id: 'pt-0', x: 0, y: 0.0, tension: 0 },
          { id: 'pt-1', x: len, y: 1.0, tension: 0 },
        ];
      case 'saw_down':
        return [
          { id: 'pt-0', x: 0, y: 1.0, tension: 0 },
          { id: 'pt-1', x: len, y: 0.0, tension: 0 },
        ];
      case 'exp_rise':
        return [
          { id: 'pt-0', x: 0, y: 0.05, tension: 0.8 },
          { id: 'pt-1', x: len, y: 1.0, tension: 0 },
        ];
      case 'exp_fall':
        return [
          { id: 'pt-0', x: 0, y: 1.0, tension: -0.8 },
          { id: 'pt-1', x: len, y: 0.05, tension: 0 },
        ];
      case 'step':
        return [
          { id: 'pt-0', x: 0, y: 0.8, tension: 0 },
          { id: 'pt-1', x: len * 0.25, y: 0.8, tension: 0 },
          { id: 'pt-2', x: len * 0.251, y: 0.2, tension: 0 },
          { id: 'pt-3', x: len * 0.5, y: 0.2, tension: 0 },
          { id: 'pt-4', x: len * 0.501, y: 1.0, tension: 0 },
          { id: 'pt-5', x: len * 0.75, y: 1.0, tension: 0 },
          { id: 'pt-6', x: len * 0.751, y: 0.4, tension: 0 },
          { id: 'pt-7', x: len, y: 0.4, tension: 0 },
        ];
      default:
        return [
          { id: 'pt-0', x: 0, y: 0.5, tension: 0 },
          { id: 'pt-1', x: len, y: 0.5, tension: 0 },
        ];
    }
  }

  public applyModulation(
    curve: CurveTrackData,
    valNorm: number,
    nodes: SpaceNode[],
    onUpdateNode?: (node: SpaceNode) => void
  ) {
    const scaledVal = curve.minValue + valNorm * (curve.maxValue - curve.minValue);
    const targetNodes = curve.targetNodeId
      ? nodes.filter((n) => n.id === curve.targetNodeId && n.type === 'container')
      : nodes.filter((n): n is ContainerNode => n.type === 'container');

    targetNodes.forEach((node) => {
      const c = node as ContainerNode;
      if (curve.targetParam === 'cutoff' && c.synthPreset) {
        c.synthPreset.cutoff = Math.round(scaledVal);
        onUpdateNode?.(c);
      } else if (curve.targetParam === 'volume' && c.synthPreset) {
        c.volume = Math.round(scaledVal * 100) / 100;
        onUpdateNode?.(c);
      } else if (curve.targetParam === 'reverb' && c.synthPreset) {
        c.synthPreset.reverb = Math.max(0, Math.min(1, scaledVal));
        onUpdateNode?.(c);
      } else if (curve.targetParam === 'delay' && c.synthPreset) {
        c.synthPreset.delay = Math.max(0, Math.min(1, scaledVal));
        onUpdateNode?.(c);
      }
    });
  }
}

export const curveEngine = new CurveEngine();
