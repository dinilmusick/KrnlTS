export interface BaseConnectionProps {
  id: string;
  sourceNodeId: string;
  sourceHandleId: string;
  targetNodeId: string;
  targetHandleId: string;
}

export abstract class BaseConnection {
  public id: string;
  public sourceNodeId: string;
  public sourceHandleId: string;
  public targetNodeId: string;
  public targetHandleId: string;

  constructor(props: BaseConnectionProps) {
    this.id = props.id;
    this.sourceNodeId = props.sourceNodeId;
    this.sourceHandleId = props.sourceHandleId;
    this.targetNodeId = props.targetNodeId;
    this.targetHandleId = props.targetHandleId;
  }
}

export interface SolidConnectionProps extends BaseConnectionProps {
  wireType?: string;
  locked?: boolean;
  lastSignal?: unknown;
  widgets?: ('DELETE' | 'INSPECT' | 'LOCK')[];
}

export class SolidConnection extends BaseConnection {
  public wireType: string;
  public locked: boolean;
  public lastSignal?: unknown;
  public widgets: ('DELETE' | 'INSPECT' | 'LOCK')[];

  constructor(props: SolidConnectionProps) {
    super(props);
    this.wireType = props.wireType ?? 'DEFAULT';
    this.locked = props.locked ?? false;
    this.lastSignal = props.lastSignal;
    this.widgets = props.widgets ?? ['DELETE', 'INSPECT', 'LOCK'];
  }

  public toggleLock(): boolean {
    this.locked = !this.locked;
    return this.locked;
  }
}

export interface ViewLinkProps {
  id: string;
  sourceNodeId: string;
  sourceViewHandleId: string;
  targetViewWindowId: string;
}

export class ViewLink extends BaseConnection {
  public sourceViewHandleId: string;
  public targetViewWindowId: string;
  public readonly widgets: string[] = [];

  constructor(props: ViewLinkProps) {
    super({
      id: props.id,
      sourceNodeId: props.sourceNodeId,
      sourceHandleId: props.sourceViewHandleId,
      targetNodeId: props.targetViewWindowId,
      targetHandleId: 'window-in'
    });
    this.sourceViewHandleId = props.sourceViewHandleId;
    this.targetViewWindowId = props.targetViewWindowId;
  }
}
