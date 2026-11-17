// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { GraphEntityParent } from '../core/GraphEntityParent';
import { SpaceNode } from "../../../types/index.js";
import { getNodeSockets, NodeSocketDescriptor, NodeSocketsResult } from '../../nodeSocketRegistry';
import { NodeAssetRegistry, Node2DSpriteSetting } from '../../nodeAssetRegistry';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * 2. GraphNodeParent: Base Model for All Space Nodes
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * Represents the fundamental mechanism of any audio/sequencing/modulation entity.
 * Encapsulates position, multi-socket routing tables, 2D sprites, 3D archetypes,
 * parameter decks, and lifecycle triggers.
 */
export abstract class GraphNodeParent<T extends SpaceNode = SpaceNode> extends GraphEntityParent {
  public readonly nodeType: SpaceNode['type'];
  public rawNode: T;
  public position: [number, number, number];
  public isSelected: boolean = false;
  public isHovered: boolean = false;

  constructor(node: T) {
    super(node.id, node.name, 'node', {
      type: node.type,
      color: node.color,
    });
    this.nodeType = node.type;
    this.rawNode = node;
    this.position = [...node.position];
    this.isActive = node.active ?? true;
  }

  public initialize(): void {
    this.emit('node_initialized', { id: this.id, type: this.nodeType });
  }

  public dispose(): void {
    this.emit('node_disposed', { id: this.id });
  }

  // ── Universal Sockets Query ──
  public getSockets(): NodeSocketsResult {
    return getNodeSockets(this.rawNode);
  }

  public getInputSockets(): NodeSocketDescriptor[] {
    return this.getSockets().inputs;
  }

  public getOutputSockets(): NodeSocketDescriptor[] {
    return this.getSockets().outputs;
  }

  public findSocket(portId: string, direction: 'in' | 'out'): NodeSocketDescriptor | undefined {
    const list = direction === 'in' ? this.getInputSockets() : this.getOutputSockets();
    return list.find((s) => s.socketId === portId);
  }

  // ── Visual & Theme Metadata ──
  public get2DSpriteConfig(): Node2DSpriteSetting {
    return NodeAssetRegistry.get2DSpriteSetting(this.rawNode);
  }

  public setPosition(pos: [number, number, number]): void {
    this.position = [pos[0], pos[1], pos[2]];
    this.rawNode.position = [pos[0], pos[1], pos[2]];
    this.emit('position_changed', this.position);
  }

  public setSelected(selected: boolean): void {
    if (this.isSelected !== selected) {
      this.isSelected = selected;
      this.emit('selection_changed', selected);
    }
  }

  public setHovered(hovered: boolean): void {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered;
      this.emit('hover_changed', hovered);
    }
  }

  // ── Node Triggering / Activation ──
  public abstract trigger(timestamp?: number): void;

  /**
   * Returns exact 2D pixel dimensions for the node card based on archetype and contents.
   */
  public getDimensions(): { width: number; height: number; halfWidth: number; halfHeight: number } {
    return GraphNodeParent.getNodeDimensions(this.rawNode);
  }

  /**
   * Resolves exact card width and height for any SpaceNode based on its archetype.
   */
  public static getNodeDimensions(node: SpaceNode): { width: number; height: number; halfWidth: number; halfHeight: number } {
    const isArrangement = node.type === 'arrangement';
    const isCode = node.type === 'code';
    const isTrigger = node.type === 'trigger';
    const isTriggerFractions = isTrigger && (node as any).triggerType === 'beat_fractions';
    const isRetroRecorder = node.type === 'recorder' && (node as any).recordingMode === 'retrospective';
    const isStandardRecorder = node.type === 'recorder' && !isRetroRecorder;
    const isContainer = node.type === 'container';
    const isStrip = node.type === 'input_strip' || node.type === 'output_strip';
    const isButton = node.type === 'button';
    const isString = node.type === 'primitive_string';
    const isNumber = node.type === 'primitive_number';
    const isBoolean = node.type === 'primitive_boolean';
    const isObject = node.type === 'primitive_object';
    const isFolderPath = node.type === 'folder_path';
    const isSubgraph = node.type === 'subgraph';
    const isGroup = node.type === 'group' || node.type === 'module';

    const width = isArrangement
      ? ((node as any).width || 600)
      : isCode
      ? ((node as any).width || 380)
      : isSubgraph
      ? 230
      : isGroup
      ? 200
      : isTriggerFractions
      ? 280
      : isTrigger
      ? 170
      : isRetroRecorder
      ? 210
      : isContainer
      ? 200
      : isFolderPath
      ? 190
      : isObject
      ? 190
      : isString
      ? 170
      : isNumber
      ? 150
      : isStandardRecorder
      ? 170
      : isStrip
      ? 155
      : isBoolean
      ? 135
      : isButton
      ? 110
      : 140;

    const height = isArrangement
      ? ((node as any).height || 300)
      : isCode
      ? ((node as any).height || 260)
      : isSubgraph
      ? 140
      : isGroup
      ? 120
      : isFolderPath
      ? 62
      : isObject
      ? 76
      : isString
      ? 60
      : isNumber
      ? 60
      : isBoolean
      ? 60
      : isTriggerFractions
      ? 116
      : isTrigger
      ? 76
      : isRetroRecorder
      ? 120
      : isContainer
      ? 120
      : isButton
      ? 110
      : 70;

    return {
      width,
      height,
      halfWidth: width / 2,
      halfHeight: height / 2,
    };
  }

  /**
   * Calculates socket local offset enforcing that the handle always appears just outside the node body on spawn,
   * and constrains any custom nudge displacement so the handle cannot be pushed into the node body area at all.
   */
  public static calculateConstrainedSocketOffset(
    node: SpaceNode,
    socketId: string,
    isOutput: boolean,
    index: number,
    totalSockets: number,
    clearance: number = 14
  ): { x: number; y: number } {
    const dims = GraphNodeParent.getNodeDimensions(node);
    const count = Math.max(1, totalSockets);
    const isCustomBox = node.type === 'arrangement' || node.type === 'code';
    const availableHeight = isCustomBox ? Math.max(100, dims.height - 70) : 0;
    const socketPitch = isCustomBox ? Math.min(42, availableHeight / count) : 40;
    const totalSpan = (count - 1) * socketPitch;
    const baseY = count === 1 ? (isCustomBox ? 14 : 10) : -totalSpan / 2 + index * socketPitch + (isCustomBox ? 14 : 10);

    // Initial spawn coordinate strictly placed outside the node body boundary
    const effectiveClearance = Math.max(12, clearance);
    const baseX = isOutput ? dims.halfWidth + effectiveClearance : -dims.halfWidth - effectiveClearance;

    const customOffsets = node.socketOffsets;
    const rawNudge = customOffsets?.[socketId] || { x: 0, y: 0 };

    // Apply strict non-penetration constraint to node body
    // The handle cannot be pushed inside [-halfWidth, halfWidth] x [-halfHeight, halfHeight]
    const effectiveTargetX = baseX + rawNudge.x;
    const effectiveTargetY = baseY + rawNudge.y;

    let constrainedX = effectiveTargetX;
    let constrainedY = effectiveTargetY;

    const minMargin = 4; // minimum margin outside node edge
    const bodyLeft = -dims.halfWidth;
    const bodyRight = dims.halfWidth;
    const bodyTop = -dims.halfHeight;
    const bodyBottom = dims.halfHeight;

    // Check if target point falls inside the node body box or penetrates boundary
    if (
      effectiveTargetX > bodyLeft - minMargin &&
      effectiveTargetX < bodyRight + minMargin &&
      effectiveTargetY > bodyTop - minMargin &&
      effectiveTargetY < bodyBottom + minMargin
    ) {
      // Push handle to the nearest exterior boundary based on socket polarity
      if (isOutput) {
        constrainedX = bodyRight + Math.max(minMargin, effectiveClearance / 2);
      } else {
        constrainedX = bodyLeft - Math.max(minMargin, effectiveClearance / 2);
      }
    }

    return {
      x: constrainedX,
      y: constrainedY,
    };
  }

  /**
   * Constrains a raw user nudge delta so that the resulting handle cannot enter the node body area.
   */
  public static constrainSocketNudge(
    node: SpaceNode,
    socketId: string,
    isOutput: boolean,
    index: number,
    totalSockets: number,
    rawNudge: { x: number; y: number },
    clearance: number = 14
  ): { x: number; y: number } {
    const dims = GraphNodeParent.getNodeDimensions(node);
    const count = Math.max(1, totalSockets);
    const isCustomBox = node.type === 'arrangement' || node.type === 'code';
    const availableHeight = isCustomBox ? Math.max(100, dims.height - 70) : 0;
    const socketPitch = isCustomBox ? Math.min(42, availableHeight / count) : 40;
    const totalSpan = (count - 1) * socketPitch;
    const baseY = count === 1 ? (isCustomBox ? 14 : 10) : -totalSpan / 2 + index * socketPitch + (isCustomBox ? 14 : 10);

    const effectiveClearance = Math.max(12, clearance);
    const baseX = isOutput ? dims.halfWidth + effectiveClearance : -dims.halfWidth - effectiveClearance;

    const targetX = baseX + rawNudge.x;
    const targetY = baseY + rawNudge.y;

    const minMargin = 4;
    const bodyLeft = -dims.halfWidth;
    const bodyRight = dims.halfWidth;
    const bodyTop = -dims.halfHeight;
    const bodyBottom = dims.halfHeight;

    let finalTargetX = targetX;
    let finalTargetY = targetY;

    if (
      targetX > bodyLeft - minMargin &&
      targetX < bodyRight + minMargin &&
      targetY > bodyTop - minMargin &&
      targetY < bodyBottom + minMargin
    ) {
      if (isOutput) {
        finalTargetX = bodyRight + Math.max(minMargin, effectiveClearance / 2);
      } else {
        finalTargetX = bodyLeft - Math.max(minMargin, effectiveClearance / 2);
      }
    }

    return {
      x: finalTargetX - baseX,
      y: finalTargetY - baseY,
    };
  }

  public toJSON(): Record<string, any> {
    return {
      ...this.rawNode,
      position: this.position,
      active: this.isActive,
    };
  }
}
