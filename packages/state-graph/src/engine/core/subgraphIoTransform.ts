/**
 * @file subgraphIoTransform.ts
 * @description Core I/O Transformation Engine for SubgraphNode Architecture.
 *
 * Programmatically converts an invoked Graph's physical I/O definitions (MapIoConfig)
 * into typed Stream Input/Output Handles on the SubgraphNode.
 *
 * Rules:
 * 1. Source of truth is Graph.definition.mapIoConfig (physicalInputs & physicalOutputs)
 * 2. Preserves data types (Audio Mono, Audio Stereo, MIDI, Trigger, Curve, Data)
 * 3. Preserves channel & configuration semantics
 * 4. FORCES variant = STREAM (Never derive Packet from Physical I/O)
 * 5. Nested SubgraphNodes never bind directly to hardware devices.
 */

import {
  DawProject,
  MapIoConfig,
  MapChannelConfig,
  SubgraphNode,
  SignalType,
  SignalMedium,
  SignalPolarity,
} from "../types/index.js";
import { createDefaultMapIoConfig } from '../types/stripsTypes';

export type SubgraphHandleDefinition = Record<string, any>;

/**
 * Converts a physical input channel definition to a SubgraphNode input handle.
 * Enforces variant = STREAM.
 */
export function convertPhysicalInputToStreamHandle(
  channel: MapChannelConfig,
  index: number
): SubgraphHandleDefinition {
  let medium: SignalMedium = 'audio_stereo';
  let signalType: SignalType = 'audio_stereo';

  if (channel.type === 'trigger' || channel.signalType === 'trigger' || channel.signalType === 'trigger_stream') {
    medium = 'trigger';
    signalType = 'trigger_stream';
  } else if (channel.type === 'audio') {
    const isMono = channel.signalType === 'audio_mono' || channel.audioFormat === 'mono';
    medium = isMono ? 'audio_mono' : 'audio_stereo';
    signalType = isMono ? 'audio_mono' : 'audio_stereo';
  } else if (channel.type === 'midi') {
    medium = 'midi';
    signalType = 'midi_stream';
  } else if (channel.type === 'osc' || channel.signalType === 'curve' || channel.signalType === 'curve_stream') {
    medium = 'curve';
    signalType = 'curve_stream';
  } else {
    medium = 'data';
    signalType = channel.signalType || 'data' as any;
  }

  const formatLabel = channel.type === 'audio' ? (medium === 'audio_mono' ? 'Mono' : 'Stereo') : '';
  const typeLabel = channel.type === 'audio' ? `Audio ${formatLabel}`.trim() : channel.type.toUpperCase();

  return {
    id: `sub-in-${channel.id || channel.sourceId || index}`,
    name: channel.name || `${typeLabel} Stream In`,
    direction: 'input',
    polarity: 'input',
    type: channel.type,
    signalType,
    medium,
    variant: 'stream', // Enforced STREAM variant rule
    dataType: 'stream',
    audioFormat: channel.audioFormat || (medium === 'audio_mono' ? 'mono' : 'stereo'),
    color: channel.color || (channel.type === 'audio' ? '#38bdf8' : channel.type === 'midi' ? '#ec4899' : '#eab308'),
    sourceChannelId: channel.id,
    socketIndex: index,
  };
}

/**
 * Converts a physical output channel definition to a SubgraphNode output handle.
 * Enforces variant = STREAM.
 */
export function convertPhysicalOutputToStreamHandle(
  channel: MapChannelConfig,
  index: number
): SubgraphHandleDefinition {
  let medium: SignalMedium = 'audio_stereo';
  let signalType: SignalType = 'audio_stereo';

  if (channel.type === 'trigger' || channel.signalType === 'trigger' || channel.signalType === 'trigger_stream') {
    medium = 'trigger';
    signalType = 'trigger_stream';
  } else if (channel.type === 'audio') {
    const isMono = channel.signalType === 'audio_mono' || channel.audioFormat === 'mono';
    medium = isMono ? 'audio_mono' : 'audio_stereo';
    signalType = isMono ? 'audio_mono' : 'audio_stereo';
  } else if (channel.type === 'midi') {
    medium = 'midi';
    signalType = 'midi_stream';
  } else if (channel.type === 'osc' || channel.signalType === 'curve' || channel.signalType === 'curve_stream') {
    medium = 'curve';
    signalType = 'curve_stream';
  } else {
    medium = 'data';
    signalType = channel.signalType || 'data' as any;
  }

  const formatLabel = channel.type === 'audio' ? (medium === 'audio_mono' ? 'Mono' : 'Stereo') : '';
  const typeLabel = channel.type === 'audio' ? `Audio ${formatLabel}`.trim() : channel.type.toUpperCase();

  return {
    id: `sub-out-${channel.id || channel.sourceId || index}`,
    name: channel.name || `${typeLabel} Stream Out`,
    direction: 'output',
    polarity: 'output',
    type: channel.type,
    signalType,
    medium,
    variant: 'stream', // Enforced STREAM variant rule
    dataType: 'stream',
    audioFormat: channel.audioFormat || (medium === 'audio_mono' ? 'mono' : 'stereo'),
    color: channel.color || (channel.type === 'audio' ? '#10b981' : channel.type === 'midi' ? '#ec4899' : '#eab308'),
    sourceChannelId: channel.id,
    socketIndex: index,
  };
}

/**
 * Derives SubgraphNode input and output stream handles directly from a Graph's physical I/O definitions.
 */
export function deriveSubgraphHandlesFromGraph(graphDefinition?: Partial<DawProject> | null): {
  inputHandles: SubgraphHandleDefinition[];
  outputHandles: SubgraphHandleDefinition[];
} {
  const ioConfig: MapIoConfig = graphDefinition?.mapIoConfig || createDefaultMapIoConfig();
  const physicalInputs = ioConfig.inputs || [];
  const physicalOutputs = ioConfig.outputs || [];

  const inputHandles = physicalInputs.map((input, idx) => convertPhysicalInputToStreamHandle(input, idx));
  const outputHandles = physicalOutputs.map((output, idx) => convertPhysicalOutputToStreamHandle(output, idx));

  return {
    inputHandles,
    outputHandles,
  };
}

/**
 * Instantiates a new SubgraphNode referencing a saved graph definition.
 */
export function instantiateSubgraphNode(
  graphDefinition: DawProject | { id: string; name: string; type?: any; mapIoConfig?: MapIoConfig; [key: string]: any },
  nodeIndex: number,
  position: [number, number, number] = [0, 0, 0]
): SubgraphNode {
  const { inputHandles, outputHandles } = deriveSubgraphHandlesFromGraph(graphDefinition as DawProject);

  return {
    id: `subgraph-${graphDefinition.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'subgraph',
    name: graphDefinition.name || 'Subgraph Node',
    position,
    color: '#8b5cf6', // Violet Subgraph theme color
    radius: 1.8,
    label: `Graph: ${graphDefinition.name || graphDefinition.id}`,
    active: true,
    graphId: graphDefinition.id,
    graphName: graphDefinition.name || 'Invoked Graph',
    graphType: (graphDefinition as any).type || 'custom',
    customTypeTag: (graphDefinition as any).customTypeTag,
    inputHandles,
    outputHandles,
    innerGraphDefinition: graphDefinition as DawProject,
  } as any;
}
