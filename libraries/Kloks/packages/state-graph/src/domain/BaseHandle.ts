export type HandleCategory = 'DATA' | 'VIEW';
export type HandleDirection = 'INPUT' | 'OUTPUT';
export type ConnectionMode = 'SINGLE' | 'MULTI';

export interface HandlePosition {
  x: number;
  y: number;
}

export interface HandleOffset {
  x: number;
  y: number;
}

export interface HandleDefinition {
  id: string;
  label?: string;
  category: HandleCategory;
  dataType: string;
  connectionMode: ConnectionMode;
  direction: HandleDirection;
}

export interface BaseHandleProps {
  id: string;
  nodeId: string;
  direction: HandleDirection;
  dataType: string;
  type?: string;
  channels?: string;
  variant?: 'Stream' | 'STREAM' | 'Packet' | 'PACKET' | string;
  connectionMode?: ConnectionMode;
  basePosition?: HandlePosition;
  offset?: HandleOffset;
  label?: string;
  socketDef?: any;
  customMeta?: Record<string, any>;
}

export abstract class BaseHandle {
  public id: string;
  public nodeId: string;
  public direction: HandleDirection;
  public dataType: string;
  public type?: string;
  public channels?: string;
  public variant?: 'Stream' | 'STREAM' | 'Packet' | 'PACKET' | string;
  public connectionMode: ConnectionMode;
  public basePosition: HandlePosition;
  public offset: HandleOffset;
  public label?: string;
  public socketDef?: any;
  public customMeta?: Record<string, any>;
  public abstract readonly handleCategory: HandleCategory;

  constructor(props: BaseHandleProps) {
    this.id = props.id;
    this.nodeId = props.nodeId;
    this.direction = props.direction;
    this.dataType = props.dataType;
    this.type = props.type;
    this.channels = props.channels;
    this.variant = props.variant;
    this.connectionMode = props.connectionMode ?? 'SINGLE';
    this.basePosition = props.basePosition ?? { x: 0, y: 0 };
    this.offset = props.offset ?? { x: 0, y: 0 };
    this.label = props.label;
    this.socketDef = props.socketDef;
    this.customMeta = props.customMeta;
  }

  public get effectivePosition(): HandlePosition {
    return {
      x: this.basePosition.x + this.offset.x,
      y: this.basePosition.y + this.offset.y
    };
  }
}

export class DataHandle extends BaseHandle {
  public readonly handleCategory: HandleCategory = 'DATA';
}

export class ViewHandle extends BaseHandle {
  public readonly handleCategory: HandleCategory = 'VIEW';
  public readonly icon: string = 'EYE';

  constructor(props: Omit<BaseHandleProps, 'dataType' | 'direction'> & { dataType?: string; direction?: HandleDirection }) {
    super({
      ...props,
      direction: props.direction ?? 'OUTPUT',
      dataType: props.dataType ?? 'VIEW'
    });
  }
}
