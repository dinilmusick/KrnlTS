// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { GraphEntityParent } from '../core/GraphEntityParent';
import { NodeConnection, SpaceNode, EffectNode } from "../../../types/index.js";
import { SignalType, SIGNAL_TYPES } from '../../../functions/canonicalSignalTable';
import { isWireAffectedByEffect } from '../../../functions/graphManager';

export interface GraphWireDescriptor {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort?: string;
  toPort?: string;
  toSocketIndex?: number;
  signalType: SignalType;
  controlPoint?: [number, number, number];
}
export type QwnsrWireDescriptor = GraphWireDescriptor;


/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * 2. GraphWireParent: Base Model for All Conduit Wires
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * Represents the fundamental mechanism of any signal conduit carrying triggers,
 * MIDI, audio streams, CV curves, component bindings, or effect fields.
 */
export abstract class GraphWireParent extends GraphEntityParent {
  public readonly fromNodeId: string;
  public readonly toNodeId: string;
  public readonly fromPort?: string;
  public readonly toPort?: string;
  public readonly toSocketIndex?: number;
  public readonly signalType: SignalType;
  public controlPoint?: [number, number, number];
  public isSelected: boolean = false;
  public flowSpeedMultiplier: number = 1.0;

  constructor(descriptor: QwnsrWireDescriptor) {
    super(descriptor.id, `Wire:${descriptor.fromNodeId}->${descriptor.toNodeId}`, 'wire', {
      signalType: descriptor.signalType,
    });
    this.fromNodeId = descriptor.fromNodeId;
    this.toNodeId = descriptor.toNodeId;
    this.fromPort = descriptor.fromPort;
    this.toPort = descriptor.toPort;
    this.toSocketIndex = descriptor.toSocketIndex;
    this.signalType = descriptor.signalType;
    this.controlPoint = descriptor.controlPoint;
  }

  public initialize(): void {
    this.emit('wire_initialized', { id: this.id, signalType: this.signalType });
  }

  public dispose(): void {
    this.emit('wire_disposed', { id: this.id });
  }

  public getColor(): string {
    return SIGNAL_TYPES[this.signalType]?.colorStr || '#38bdf8';
  }

  public getHexColor(): number {
    return SIGNAL_TYPES[this.signalType]?.colorHex || 0x38bdf8;
  }

  public setSelected(selected: boolean): void {
    if (this.isSelected !== selected) {
      this.isSelected = selected;
      this.emit('selection_changed', selected);
    }
  }

  public setControlPoint(point?: [number, number, number]): void {
    this.controlPoint = point;
    this.emit('control_point_changed', point);
  }

  public isEnvelopedByEffect(effects: EffectNode[], fromNode?: SpaceNode, toNode?: SpaceNode): boolean {
    if (!fromNode || !toNode) return false;
    const conn: NodeConnection = {
      id: this.id,
      fromNodeId: this.fromNodeId,
      toNodeId: this.toNodeId,
      fromPort: this.fromPort,
      toPort: this.toPort,
      toSocketIndex: this.toSocketIndex,
      signalType: this.signalType as any,
      controlPoint: this.controlPoint,
      latencyBeats: 0,
    };
    return effects.some((effect) => effect.active && isWireAffectedByEffect(effect, conn, fromNode, toNode));
  }

  public calculateCubicBezier2D(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): { pathD: string; cp1: { x: number; y: number }; cp2: { x: number; y: number } } {
    const dx = p2.x - p1.x;
    const offset = Math.max(30, Math.abs(dx) * 0.5);
    const cp1 = { x: p1.x + offset, y: p1.y };
    const cp2 = { x: p2.x - offset, y: p2.y };
    const pathD = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
    return { pathD, cp1, cp2 };
  }

  public calculatePulsePoint2D(
    t: number,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    cp1: { x: number; y: number },
    cp2: { x: number; y: number }
  ): { x: number; y: number } {
    const clampedT = Math.max(0, Math.min(1, t));
    const invT = 1 - clampedT;
    const x =
      Math.pow(invT, 3) * p1.x +
      3 * Math.pow(invT, 2) * clampedT * cp1.x +
      3 * invT * Math.pow(clampedT, 2) * cp2.x +
      Math.pow(clampedT, 3) * p2.x;
    const y =
      Math.pow(invT, 3) * p1.y +
      3 * Math.pow(invT, 2) * clampedT * cp1.y +
      3 * invT * Math.pow(clampedT, 2) * cp2.y +
      Math.pow(clampedT, 3) * p2.y;
    return { x, y };
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      fromNodeId: this.fromNodeId,
      toNodeId: this.toNodeId,
      fromPort: this.fromPort,
      toPort: this.toPort,
      toSocketIndex: this.toSocketIndex,
      signalType: this.signalType,
      controlPoint: this.controlPoint,
    };
  }
}
