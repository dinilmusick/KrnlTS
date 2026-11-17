import { SpaceNode, UniversalSocketDefinition } from "../../../types/index.js";
import { getNodeSockets, createPackagedSocket } from '../../nodeSocketRegistry.js';
import { GraphNodeParent } from '../nodes/GraphNodeParent.js';
import { BaseNode } from '../../../../domain/BaseNode.js';
import { DataHandle } from '../../../../domain/BaseHandle.js';
import { CompatibilityMatrix } from '../../../../rules/CompatibilityMatrix.js';
import { WireTypeRegistry } from '../../../../rules/WireTypeRegistry.js';
import { HandleTypeRegistry } from '../../../../rules/HandleTypeRegistry.js';
import { validateUniversalConnection, areSignalsCompatible } from '../../../functions/universalConnectionEngine.js';

export const COORD_SCALE = 40;

export class GraphBridgeNode extends BaseNode {
  public readonly originalSpaceNode: SpaceNode;

  constructor(spaceNode: SpaceNode, handles: DataHandle[]) {
    const dims = GraphNodeParent.getNodeDimensions(spaceNode);
    const pos = Array.isArray(spaceNode.position)
      ? { x: spaceNode.position[0] * COORD_SCALE, y: (spaceNode.position[2] ?? spaceNode.position[1] ?? 0) * COORD_SCALE }
      : spaceNode.position && typeof spaceNode.position === 'object'
      ? { x: Number((spaceNode.position as any).x ?? 0), y: Number((spaceNode.position as any).y ?? 0) }
      : { x: 0, y: 0 };
    super({
      id: spaceNode.id,
      type: spaceNode.type,
      label: spaceNode.name || (spaceNode as any).label || spaceNode.id,
      position: pos,
      size: { width: dims.width, height: dims.height },
      handles,
    });
    this.originalSpaceNode = spaceNode;
  }
}

export type QwnsrBridgeNode = GraphBridgeNode;
export const QwnsrBridgeNode = GraphBridgeNode;
export const initializeQwnsrMagneticRules = initializeMagneticRules;

let rulesInitialized = false;

export function initializeMagneticRules(): void {
  if (rulesInitialized) return;
  rulesInitialized = true;


  const signals = [
    { type: 'AUDIO_STEREO', color: '#00ffff' },
    { type: 'AUDIO_MONO', color: '#38bdf8' },
    { type: 'AUDIO_PACKET', color: '#818cf8' },
    { type: 'TRIGGER', color: '#fb923c' },
    { type: 'MIDI_STREAM', color: '#ec4899' },
    { type: 'MIDI_PACKET', color: '#f43f5e' },
    { type: 'CURVE_STREAM', color: '#10b981' },
    { type: 'CURVE_PACKET', color: '#34d399' },
    { type: 'COMPONENT', color: '#a855f7' },
  ];

  for (const s of signals) {
    HandleTypeRegistry.register({ dataType: s.type, category: 'DATA' });
    WireTypeRegistry.register({ wireType: s.type, color: s.color, strokeWidth: 2.5, style: 'bezier' });
    CompatibilityMatrix.registerRule({
      sourceCategory: 'DATA',
      sourceDataType: s.type,
      targetCategory: 'DATA',
      targetDataType: s.type,
      allowed: true,
      wireType: s.type,
      priority: 20,
    });
  }

  // Register single source of truth compatibility resolver
  CompatibilityMatrix.setCustomResolver((sourceHandle, targetHandle, sourceNode, targetNode) => {
    // 1. If nodes are QwnsrBridgeNode instances, execute validateUniversalConnection with full node and socket context
    if (sourceNode instanceof QwnsrBridgeNode && targetNode instanceof QwnsrBridgeNode) {
      const fromNode = sourceNode.originalSpaceNode;
      const toNode = targetNode.originalSpaceNode;
      const fromPort = 'id' in sourceHandle ? sourceHandle.id : undefined;
      const toPort = 'id' in targetHandle ? targetHandle.id : undefined;

      const validation = validateUniversalConnection(fromNode, fromPort, toNode, toPort);
      return {
        allowed: validation.isCompatible,
        wireType: (validation.canonicalSignalType || 'audio_stereo').toUpperCase(),
        priority: validation.isCompatible ? 20 : 0,
        reason: validation.reason || (validation.isCompatible ? 'Compatible' : 'Incompatible'),
      };
    }

    // 2. If handles have attached socketDef, execute areSignalsCompatible directly
    const sDef: UniversalSocketDefinition | undefined = (sourceHandle as any)?.socketDef;
    const tDef: UniversalSocketDefinition | undefined = (targetHandle as any)?.socketDef;
    if (sDef && tDef) {
      const res = areSignalsCompatible(sDef, tDef);
      return {
        allowed: res.isCompatible,
        wireType: (res.canonicalSignalType || sDef.signalType).toUpperCase(),
        priority: res.isCompatible ? 20 : 0,
        reason: res.reason || (res.isCompatible ? 'Compatible' : 'Incompatible'),
      };
    }

    return null;
  });
}

export function mapSpaceNodeToBridgeNode(spaceNode: SpaceNode): GraphBridgeNode {
  initializeMagneticRules();
  let { inputs, outputs } = getNodeSockets(spaceNode);
  const rawInputs = (spaceNode as any).inputs;
  const rawOutputs = (spaceNode as any).outputs;
  if (Array.isArray(rawInputs)) {
    inputs = rawInputs.map((inp: any, idx: number) => createPackagedSocket({
      socketId: inp.id || `in_${idx}`,
      label: inp.label || inp.id || 'IN',
      polarity: 'input',
      medium: (inp.dataType?.toLowerCase().includes('audio') ? 'audio_stereo' : 'trigger') as any,
      dataType: 'stream',
      signalType: (inp.dataType?.toLowerCase() || 'audio_stereo') as any,
      description: inp.label || 'Input Socket',
    }));
  }
  if (Array.isArray(rawOutputs)) {
    outputs = rawOutputs.map((out: any, idx: number) => createPackagedSocket({
      socketId: out.id || `out_${idx}`,
      label: out.label || out.id || 'OUT',
      polarity: 'output',
      medium: (out.dataType?.toLowerCase().includes('audio') ? 'audio_stereo' : 'trigger') as any,
      dataType: 'stream',
      signalType: (out.dataType?.toLowerCase() || 'audio_stereo') as any,
      description: out.label || 'Output Socket',
    }));
  }
  const handles: DataHandle[] = [];
  const customOffsets = spaceNode.socketOffsets;
  const dims = GraphNodeParent.getNodeDimensions(spaceNode);

  const mapSocket = (s: UniversalSocketDefinition, dir: 'INPUT' | 'OUTPUT', idx: number, total: number) => {
    const isOutput = dir === 'OUTPUT';
    const isCustomBox = spaceNode.type === 'arrangement' || spaceNode.type === 'code';
    const clearance = isCustomBox ? 16 : 14;

    const constrainedPos = GraphNodeParent.calculateConstrainedSocketOffset(
      spaceNode,
      s.socketId,
      isOutput,
      idx,
      total,
      clearance
    );

    const baseX = isOutput ? dims.halfWidth + clearance : -dims.halfWidth - clearance;
    const count = Math.max(1, total);
    const availableHeight = isCustomBox ? Math.max(100, dims.height - 70) : 0;
    const socketPitch = isCustomBox ? Math.min(42, availableHeight / count) : 40;
    const totalSpan = (count - 1) * socketPitch;
    const baseY = count === 1 ? (isCustomBox ? 14 : 10) : -totalSpan / 2 + idx * socketPitch + (isCustomBox ? 14 : 10);

    const rawNudge = customOffsets?.[s.socketId] || { x: 0, y: 0 };
    const effectiveOffset = {
      x: constrainedPos.x - baseX,
      y: constrainedPos.y - baseY,
    };

    return new DataHandle({
      id: s.socketId,
      nodeId: spaceNode.id,
      direction: dir,
      dataType: s.signalType.toUpperCase(),
      label: s.label,
      connectionMode: s.connectivity === 'multi' ? 'MULTI' : 'SINGLE',
      basePosition: { x: baseX, y: baseY },
      offset: effectiveOffset,
      socketDef: s,
      customMeta: s.customMeta,
    } as any);
  };

  inputs.forEach((sock, idx) => handles.push(mapSocket(sock, 'INPUT', idx, inputs.length)));
  outputs.forEach((sock, idx) => handles.push(mapSocket(sock, 'OUTPUT', idx, outputs.length)));

  return new GraphBridgeNode(spaceNode, handles);
}

