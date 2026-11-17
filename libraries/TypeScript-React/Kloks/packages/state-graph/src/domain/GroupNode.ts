import { BaseNode, BaseNodeProps, NodePosition, NodeSize } from './BaseNode.js';
import type { BaseHandle } from './BaseHandle.js';
import type { BaseConnection } from './BaseConnection.js';

export interface GroupNodeProps extends Partial<BaseNodeProps> {
  innerNodes?: BaseNode[];
  innerConnections?: BaseConnection[];
  childGroups?: string[];
  exposedInputs?: BaseHandle[];
  exposedOutputs?: BaseHandle[];
  description?: string;
  category?: string;
}

/**
 * GroupNode:
 * Reclassified collapsed UI/container representation of an existing collection of graph nodes.
 * Preserves the internal node group.
 * NOT a reusable graph invocation.
 */
export class GroupNode extends BaseNode {
  public innerNodes: BaseNode[];
  public innerConnections: BaseConnection[];
  public childGroups: string[];
  public exposedInputs: BaseHandle[];
  public exposedOutputs: BaseHandle[];
  public description?: string;
  public category?: string;
  public readonly isGroupNode = true;

  constructor(props: GroupNodeProps) {
    super({
      id: props.id ?? `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: props.type ?? 'group',
      label: props.label ?? 'Group',
      position: props.position ?? { x: 0, y: 0 },
      size: props.size ?? { width: 200, height: 120 },
      ...props,
    });
    this.innerNodes = props.innerNodes ? [...props.innerNodes] : [];
    this.innerConnections = props.innerConnections ? [...props.innerConnections] : [];
    this.childGroups = props.childGroups ? [...props.childGroups] : [];
    this.exposedInputs = props.exposedInputs ? [...props.exposedInputs] : [];
    this.exposedOutputs = props.exposedOutputs ? [...props.exposedOutputs] : [];
    this.description = props.description;
    this.category = props.category;
  }
}
