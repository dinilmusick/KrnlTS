import { BaseNode, BaseNodeProps, NodePosition } from './BaseNode.js';
import { DataHandle, BaseHandle } from './BaseHandle.js';

export type SignalVariant = 'Stream' | 'Packet';

export interface PhysicalInputDefinition {
  id?: string;
  name?: string;
  type: string; // e.g. 'Audio', 'MIDI', 'Trigger', 'Curve'
  channels?: 'Mono' | 'Stereo' | 'mono' | 'stereo' | string;
  variant?: string; // If passed as Packet or other, will be forced to Stream
  config?: Record<string, unknown>;
}

export interface PhysicalOutputDefinition {
  id?: string;
  name?: string;
  type: string; // e.g. 'Audio', 'MIDI', 'Trigger', 'Curve'
  channels?: 'Mono' | 'Stereo' | 'mono' | 'stereo' | string;
  variant?: string;
  config?: Record<string, unknown>;
}

export interface GraphDefinition {
  id: string;
  name: string;
  description?: string;
  physicalInputs: PhysicalInputDefinition[];
  physicalOutputs: PhysicalOutputDefinition[];
  nodes?: any[];
  connections?: any[];
  settings?: Record<string, unknown>;
}

/**
 * Normalizes channel casing: 'mono' -> 'Mono', 'stereo' -> 'Stereo'
 */
function normalizeChannels(ch?: string): 'Mono' | 'Stereo' | undefined {
  if (!ch) return undefined;
  const lower = ch.toLowerCase();
  if (lower === 'mono') return 'Mono';
  if (lower === 'stereo') return 'Stereo';
  return ch as any;
}

/**
 * Normalizes type name: 'audio' -> 'Audio', 'midi' -> 'MIDI'
 */
function normalizeDataType(t: string): string {
  const lower = t.toLowerCase();
  if (lower === 'audio') return 'Audio';
  if (lower === 'midi') return 'MIDI';
  if (lower === 'trigger') return 'Trigger';
  if (lower === 'curve') return 'Curve';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Programmatic conversion of a physical input definition to a logical Stream Input Handle.
 * Preserves data type, preserves channel semantics, and forces variant = STREAM.
 * Never derives Packet.
 */
export function convertPhysicalInputToStreamHandle(
  physicalInput: PhysicalInputDefinition,
  nodeId: string,
  index: number = 0
): DataHandle {
  const normType = normalizeDataType(physicalInput.type);
  const normChannels = normalizeChannels(physicalInput.channels);

  // Derive composite type identifier e.g. Audio.Mono.Stream or MIDI.Stream
  const dataType = normChannels
    ? `${normType}.${normChannels}.Stream`
    : `${normType}.Stream`;

  const label = physicalInput.name || `${normType}${normChannels ? ' ' + normChannels : ''} Stream IN`;
  const handleId = physicalInput.id || `in_${normType.toLowerCase()}_${normChannels ? normChannels.toLowerCase() + '_' : ''}${index}`;

  const handle = new DataHandle({
    id: handleId,
    nodeId,
    direction: 'INPUT',
    dataType,
    type: normType,
    channels: normChannels,
    variant: 'Stream',
    connectionMode: 'SINGLE',
    label,
  });

  // Guarantee variant property is set to 'Stream' and cannot be Packet
  (handle as any).variant = 'Stream';
  (handle as any).type = normType;
  if (normChannels) (handle as any).channels = normChannels;

  return handle;
}

/**
 * Programmatic conversion of a physical output definition to a logical Stream Output Handle.
 * Preserves data type, preserves channel semantics, and forces variant = STREAM.
 * Never derives Packet.
 */
export function convertPhysicalOutputToStreamHandle(
  physicalOutput: PhysicalOutputDefinition,
  nodeId: string,
  index: number = 0
): DataHandle {
  const normType = normalizeDataType(physicalOutput.type);
  const normChannels = normalizeChannels(physicalOutput.channels);

  // Derive composite type identifier e.g. Audio.Stereo.Stream or MIDI.Stream
  const dataType = normChannels
    ? `${normType}.${normChannels}.Stream`
    : `${normType}.Stream`;

  const label = physicalOutput.name || `${normType}${normChannels ? ' ' + normChannels : ''} Stream OUT`;
  const handleId = physicalOutput.id || `out_${normType.toLowerCase()}_${normChannels ? normChannels.toLowerCase() + '_' : ''}${index}`;

  const handle = new DataHandle({
    id: handleId,
    nodeId,
    direction: 'OUTPUT',
    dataType,
    type: normType,
    channels: normChannels,
    variant: 'Stream',
    connectionMode: 'MULTI',
    label,
  });

  (handle as any).variant = 'Stream';
  (handle as any).type = normType;
  if (normChannels) (handle as any).channels = normChannels;

  return handle;
}

export interface SubgraphNodeProps extends BaseNodeProps {
  reference: GraphDefinition;
  graphId?: string;
  graphName?: string;
  inputHandles?: DataHandle[];
  outputHandles?: DataHandle[];
}

/**
 * SubgraphNode:
 * Reusable invocation of a saved graph (graph-as-node).
 * Dynamically derives exposed logical I/O from the invoked graph definition.
 * Does NOT directly bind to hardware; parent graph controls user connections.
 */
export class SubgraphNode extends BaseNode {
  public reference: GraphDefinition;
  public graphId: string;
  public graphName: string;
  public inputHandles: DataHandle[];
  public outputHandles: DataHandle[];
  public readonly isSubgraphNode = true;

  constructor(props: SubgraphNodeProps | GraphDefinition) {
    // Support either SubgraphNodeProps or direct GraphDefinition constructor invocation
    const isDirectDef = (props as GraphDefinition).physicalInputs !== undefined;
    const def = isDirectDef ? (props as GraphDefinition) : (props as SubgraphNodeProps).reference;
    const customProps: Partial<SubgraphNodeProps> = isDirectDef ? {} : (props as SubgraphNodeProps);

    super({
      id: customProps.id ?? `subgraph-${def.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'subgraph',
      label: customProps.label ?? def.name,
      position: customProps.position ?? { x: 0, y: 0 },
      size: customProps.size ?? { width: 220, height: 140 },
      ...customProps,
    });

    this.reference = def;
    this.graphId = def.id;
    this.graphName = def.name;
    this.inputHandles = customProps.inputHandles ? [...customProps.inputHandles] : [];
    this.outputHandles = customProps.outputHandles ? [...customProps.outputHandles] : [];
  }

  public addInputHandle(handle: DataHandle): void {
    const existingIdx = this.inputHandles.findIndex((h) => h.id === handle.id);
    if (existingIdx >= 0) {
      this.inputHandles[existingIdx] = handle;
    } else {
      this.inputHandles.push(handle);
    }
    this.addHandle(handle);
  }

  public addOutputHandle(handle: DataHandle): void {
    const existingIdx = this.outputHandles.findIndex((h) => h.id === handle.id);
    if (existingIdx >= 0) {
      this.outputHandles[existingIdx] = handle;
    } else {
      this.outputHandles.push(handle);
    }
    this.addHandle(handle);
  }
}

/**
 * Programmatic instantiation of a SubgraphNode from a GraphDefinition.
 * Follows the exact architectural model:
 * 
 * function instantiateSubgraph(graphDefinition):
 *     node = new SubgraphNode(graphDefinition)
 * 
 *     for physicalInput in graphDefinition.physicalInputs:
 *         handle = convertPhysicalInputToStreamHandle(physicalInput)
 *         node.addInputHandle(handle)
 * 
 *     for physicalOutput in graphDefinition.physicalOutputs:
 *         handle = convertPhysicalOutputToStreamHandle(physicalOutput)
 *         node.addOutputHandle(handle)
 * 
 *     node.reference = graphDefinition
 *     return node
 */
export function instantiateSubgraph(
  graphDefinition: GraphDefinition,
  position?: NodePosition
): SubgraphNode {
  const node = new SubgraphNode({
    id: `subgraph-${graphDefinition.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'subgraph',
    label: graphDefinition.name,
    position: position ?? { x: 0, y: 0 },
    reference: graphDefinition,
    graphId: graphDefinition.id,
    graphName: graphDefinition.name,
  });

  for (let i = 0; i < (graphDefinition.physicalInputs || []).length; i++) {
    const physicalInput = graphDefinition.physicalInputs[i];
    const handle = convertPhysicalInputToStreamHandle(physicalInput, node.id, i);
    node.addInputHandle(handle);
  }

  for (let i = 0; i < (graphDefinition.physicalOutputs || []).length; i++) {
    const physicalOutput = graphDefinition.physicalOutputs[i];
    const handle = convertPhysicalOutputToStreamHandle(physicalOutput, node.id, i);
    node.addOutputHandle(handle);
  }

  node.reference = graphDefinition;
  return node;
}
