import type { NodePosition, NodeSize } from './BaseNode.js';

export type DynamicState = 'INACTIVE' | 'ACTIVE' | 'PINNED_LIVE';

export interface BaseViewWindowProps {
  id: string;
  viewType: string;
  sourceNodeId: string;
  position: NodePosition;
  size?: NodeSize;
  selected?: boolean;
  pinnedLive?: boolean;
  snapshot?: unknown;
}

export abstract class BaseViewWindow {
  public id: string;
  public viewType: string;
  public sourceNodeId: string;
  public position: NodePosition;
  public size: NodeSize;
  public selected: boolean;
  public pinnedLive: boolean;
  public snapshot?: unknown;

  constructor(props: BaseViewWindowProps) {
    this.id = props.id;
    this.viewType = props.viewType;
    this.sourceNodeId = props.sourceNodeId;
    this.position = { ...props.position };
    this.size = props.size ?? { width: 480, height: 360 };
    this.selected = props.selected ?? false;
    this.pinnedLive = props.pinnedLive ?? false;
    this.snapshot = props.snapshot;
  }

  public get dynamicState(): DynamicState {
    if (this.pinnedLive) return 'PINNED_LIVE';
    return this.selected ? 'ACTIVE' : 'INACTIVE';
  }

  public setPinnedLive(pinned: boolean): void {
    this.pinnedLive = pinned;
  }

  public setSelected(selected: boolean): void {
    this.selected = selected;
  }

  public captureSnapshot(data: unknown): void {
    this.snapshot = data;
  }
}

export class CustomViewWindow extends BaseViewWindow {
  public appSpecificContent?: unknown;
}
