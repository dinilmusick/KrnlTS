import type { BaseHandle, HandleDefinition } from './BaseHandle.js';

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeSize {
  width: number;
  height: number;
}

export interface NodeDefinition {
  type: string;
  label: string;
  description?: string;
  /** Automatic node-menu grouping category. */
  category?: string;
  /** Controls whether this node is discoverable from generic graph spawn menus. */
  menu?: {
    visible?: boolean;
  };
  inputs?: HandleDefinition[];
  outputs?: HandleDefinition[];
  views?: string[];
  metadata?: Record<string, unknown>;
}

export interface BaseNodeProps {
  id: string;
  type: string;
  label?: string;
  position: NodePosition;
  size?: NodeSize;
  handles?: BaseHandle[];
  state?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  positionLocked?: boolean;
}

export abstract class BaseNode {
  public id: string;
  public type: string;
  public label: string;
  public position: NodePosition;
  public size: NodeSize;
  public handles: BaseHandle[];
  public state: Record<string, unknown>;
  public metadata: Record<string, unknown>;
  public settings: Record<string, unknown>;
  public positionLocked: boolean;

  constructor(props: BaseNodeProps) {
    this.id = props.id;
    this.type = props.type;
    this.label = props.label ?? props.type;
    this.position = { ...props.position };
    this.size = props.size ?? { width: 180, height: 120 };
    this.handles = props.handles ? [...props.handles] : [];
    this.state = props.state ? { ...props.state } : {};
    this.metadata = props.metadata ? { ...props.metadata } : {};
    this.settings = props.settings ? { ...props.settings } : {};
    this.positionLocked = props.positionLocked ?? false;
  }

  public getHandle(handleId: string): BaseHandle | undefined {
    return this.handles.find(h => h.id === handleId);
  }

  public addHandle(handle: BaseHandle): void {
    const existingIndex = this.handles.findIndex(h => h.id === handle.id);
    if (existingIndex >= 0) {
      this.handles[existingIndex] = handle;
    } else {
      this.handles.push(handle);
    }
  }

  public lockPosition(): void {
    this.positionLocked = true;
  }

  public unlockPosition(): void {
    this.positionLocked = false;
  }

  /**
   * Calculates spawn and constrained positions for handles ensuring they are placed just outside
   * the node body and cannot be pushed into the node body area.
   */
  public calculateConstrainedHandleOffset(
    handleId: string,
    isOutput: boolean,
    index: number,
    totalHandles: number,
    clearance: number = 14
  ): { x: number; y: number } {
    const halfWidth = this.size.width / 2;
    const halfHeight = this.size.height / 2;
    const count = Math.max(1, totalHandles);
    const availableHeight = Math.max(60, this.size.height - 40);
    const pitch = Math.min(40, availableHeight / count);
    const totalSpan = (count - 1) * pitch;
    const baseY = count === 1 ? 0 : -totalSpan / 2 + index * pitch;

    const effectiveClearance = Math.max(12, clearance);
    const baseX = isOutput ? halfWidth + effectiveClearance : -halfWidth - effectiveClearance;

    const existingHandle = this.getHandle(handleId);
    const offset = existingHandle?.offset || { x: 0, y: 0 };

    const targetX = baseX + offset.x;
    const targetY = baseY + offset.y;

    const minMargin = 4;
    const bodyLeft = -halfWidth;
    const bodyRight = halfWidth;
    const bodyTop = -halfHeight;
    const bodyBottom = halfHeight;

    let constrainedX = targetX;
    let constrainedY = targetY;

    if (
      targetX > bodyLeft - minMargin &&
      targetX < bodyRight + minMargin &&
      targetY > bodyTop - minMargin &&
      targetY < bodyBottom + minMargin
    ) {
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
}

export class CustomNode extends BaseNode {
  public customDefinition?: NodeDefinition;
}
