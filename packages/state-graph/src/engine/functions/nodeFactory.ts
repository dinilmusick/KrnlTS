// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  TriggerNode,
  TriggerType,
  EffectNode,
  CombinerNode,
  MultiplexerNode,
  EffectType,
  SignalType,
  SignalKind,
  ModuleNode,
  GroupNode,
  SubgraphNode,
  GraphDefinition,
  ModuleSocketMapping,
  SpaceNode,
  NodeConnection,
  ConverterNode,
  ControlNode,
  ControlElement,
  ButtonNode,
  CodeNode,
  StringNode,
  NumberNode,
  BooleanNode,
  ObjectNode,
  FolderPathNode,
  AssetPoolScope,
} from "../types/index.js";
import { DEFAULT_CODE_NODE_SCRIPT } from './codeLinter';
import { createContainerNode } from './containerFactory';
import { instantiateSubgraphSpaceNode } from '../core/workspaceGraphRegistry';

export {
  createContainerNode,
  createRecorderNode,
  createPlayerNode,
  createSamplerNode,
  createAudioPadsNode,
} from './containerFactory';

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS, INTERFACES & TYPES
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. PURE MATHEMATICAL & TRANSFORMATION LOGIC (L0 / L1)
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Utility & Role:
 *   Instantiates hardware signal route nodes, trigger emitters, effect spatial boundaries,
 *   signal fusion combiners, and signal split multiplexers.
 *
 * Usage Example:
 *   const audioInput = createAudioInputNode(1);
 *   const clockTrigger = createTriggerNode(2);
 *
 * ASCII Flow Chart:
 *   [Requested Node Type]
 *             │
 *             ├─► 'trigger' ──────► [TriggerNode] (function name: Clock Trigger)
 *             ├─► 'effect' ───────► [EffectNode] (function name: Delay/Repeater Effect)
 *             ├─► 'combiner' ─────► [CombinerNode] (function name: Combiner)
 *             └─► 'multiplexer' ──► [MultiplexerNode] (function name: Multiplexer)
 */

export function createConverterNode(
  converterType: 'stereo_to_mono' | 'mono_to_stereo',
  index: number,
  position?: [number, number, number]
): ConverterNode {
  const isStereoToMono = converterType === 'stereo_to_mono';
  return {
    id: `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'converter',
    converterType,
    name: isStereoToMono ? `Stereo -> Mono ${index}` : `Mono -> Stereo ${index}`,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: isStereoToMono ? '#06b6d4' : '#ec4899',
    radius: 1.5,
    label: isStereoToMono ? 'Stereo -> Mono Converter' : 'Mono -> Stereo Converter',
    active: true,
    mode: 'sum',
    gain: 1.0,
  };
}

export function createTriggerNode(
  index: number,
  position?: [number, number, number],
  triggerType: TriggerType = 'beats'
): TriggerNode {
  const isFraction = triggerType === 'beat_fractions';
  return {
    id: `trig-${Date.now()}`,
    type: 'trigger',
    name: isFraction ? `Fractions Sequencer ${index}` : `Beats Sequencer ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    triggerType,
    intervalBeats: isFraction ? 0.25 : 1,
    divisionMode: isFraction ? 'divisions' : 'every_beat',
    divisionsPerBeat: isFraction ? 64 : 1,
    stepsPerCycle: isFraction ? 64 : 4,
    activeSteps: [true, true, true, true],
    activeFractions: isFraction ? Array.from({ length: 64 }, (_, i) => i % 16 === 0) : undefined,
    active: true,
    color: '#fbbf24',
    label: isFraction ? 'Fractions Seq' : 'Beats Seq',
    acceptedEffects: ['repeater', 'delay'],
  };
}

export function createButtonNode(index: number, position?: [number, number, number]): ButtonNode {
  return {
    id: `btn-${Date.now()}`,
    type: 'button',
    name: `Button Trigger ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    active: true,
    color: '#34d399',
    radius: 1.0,
    label: 'Manual Trigger',
    buttonMode: 'momentary',
    buttonState: false,
  };
}

export function createEffectNode(
  type: EffectType,
  index: number,
  position?: [number, number, number],
  signalType?: SignalType
): EffectNode {
  // Enforce protocol binding for specialized effect orbs
  let effectiveSignalType: SignalType = signalType || 'trigger';
  if (
    type === 'gain' ||
    type === 'eq' ||
    type === 'compressor' ||
    type === 'multiband_compressor' ||
    type === 'limiter' ||
    type === 'reverb' ||
    type === 'saturation'
  ) {
    effectiveSignalType = 'audio_stereo';
  } else if (type === 'pan') {
    effectiveSignalType = 'audio_stereo';
  } else if (type === 'velocity') {
    effectiveSignalType = 'midi';
  }

  const signalColorMap: Record<SignalType, string> = {
    trigger: type === 'repeater' ? '#c084fc' : '#a855f7',
    trigger_stream: type === 'repeater' ? '#f59e0b' : '#d97706',
    trigger_packet: '#f97316',
    midi_stream: '#a855f7',
    midi_packet: '#38bdf8',
    audio_stream: '#f43f5e',
    audio_packet: '#ec4899',
    curve_stream: '#14b8a6',
    curve_packet: '#34d399',
    midi: type === 'velocity' ? '#0ea5e9' : type === 'repeater' ? '#38bdf8' : '#0284c7',
    audio: type === 'gain' ? '#f43f5e' : type === 'repeater' ? '#fb7185' : '#e11d48',
    audio_mono: '#06b6d4',
    audio_stereo:
      type === 'eq'
        ? '#06b6d4'
        : type === 'compressor'
        ? '#f59e0b'
        : type === 'multiband_compressor'
        ? '#d97706'
        : type === 'limiter'
        ? '#ef4444'
        : type === 'reverb'
        ? '#8b5cf6'
        : type === 'saturation'
        ? '#f97316'
        : '#ec4899',
    curve: type === 'repeater' ? '#34d399' : '#10b981',
    omni_packet: '#a855f7',
    omni_stream: '#38bdf8',
    omni: '#a855f7',
    component: '#10b981',
    effect: '#8b5cf6',
    string: '#06b6d4',
    number: '#f97316',
    boolean: '#a855f7',
    object: '#3b82f6',
    array: '#ec4899',
  };

  let defaultName = `${effectiveSignalType.toUpperCase()} Effect ${index}`;
  let defaultLabel = `${effectiveSignalType.toUpperCase()} Effect`;
  if (type === 'repeater') {
    defaultName = `${effectiveSignalType.toUpperCase()} Repeater ${index}`;
    defaultLabel = `${effectiveSignalType.toUpperCase()} Pulse Repeater`;
  } else if (type === 'delay') {
    defaultName = `Stereo Delay ${index}`;
    defaultLabel = 'Stereo Delay / Echo';
  } else if (type === 'gain') {
    defaultName = `Audio Gain Scaler ${index}`;
    defaultLabel = 'Audio Wire Gain';
  } else if (type === 'pan') {
    defaultName = `Audio Stereo Pan ${index}`;
    defaultLabel = 'Audio Wire Pan';
  } else if (type === 'velocity') {
    defaultName = `MIDI Velocity Scaler ${index}`;
    defaultLabel = 'MIDI Wire Velocity Scaler';
  } else if (type === 'eq') {
    defaultName = `Parametric EQ ${index}`;
    defaultLabel = '4-Band Parametric EQ';
  } else if (type === 'compressor') {
    defaultName = `Studio Compressor ${index}`;
    defaultLabel = 'Compressor & Sidechain';
  } else if (type === 'multiband_compressor') {
    defaultName = `Multiband Compressor ${index}`;
    defaultLabel = '3-Band Sidechain Compressor';
  } else if (type === 'limiter') {
    defaultName = `Peak Limiter ${index}`;
    defaultLabel = 'Brickwall Peak Limiter';
  } else if (type === 'reverb') {
    defaultName = `Studio Reverb ${index}`;
    defaultLabel = 'Algorithmic Stereo Reverb';
  } else if (type === 'saturation') {
    defaultName = `Harmonic Saturation ${index}`;
    defaultLabel = 'Tape / Tube Saturation';
  }

  return {
    id: `eff-${Date.now()}`,
    type: 'effect',
    effectType: type,
    signalType: effectiveSignalType,
    name: defaultName,
    position: [
      position ? position[0] : (Math.random() - 0.5) * 8,
      3.5,
      position ? position[2] : (Math.random() - 0.5) * 8,
    ],
    radius: 6.0,
    active: true,
    color: signalColorMap[effectiveSignalType] || '#c084fc',
    label: defaultLabel,
    repeaterConfig:
      type === 'repeater'
        ? {
            repeats: 3,
            repeatIntervalBeats: 0.25,
            decay: 0.8,
          }
        : undefined,
    delayConfig:
      type === 'delay'
        ? {
            delayBeats: 0.5,
            feedback: 0.4,
            wetMix: 0.6,
          }
        : undefined,
    gainConfig:
      type === 'gain'
        ? {
            gain: 1.0,
          }
        : undefined,
    panConfig:
      type === 'pan'
        ? {
            pan: 0.0,
          }
        : undefined,
    velocityConfig:
      type === 'velocity'
        ? {
            multiplier: 1.0,
            offset: 0,
            randomize: 0,
          }
        : undefined,
    eqConfig:
      type === 'eq'
        ? {
            bands: [
              { id: 'b1', type: 'lowshelf', frequency: 100, gain: 0, q: 0.7, enabled: true, label: 'LOW' },
              { id: 'b2', type: 'peaking', frequency: 500, gain: 0, q: 1.0, enabled: true, label: 'L-MID' },
              { id: 'b3', type: 'peaking', frequency: 2500, gain: 0, q: 1.0, enabled: true, label: 'H-MID' },
              { id: 'b4', type: 'highshelf', frequency: 8000, gain: 0, q: 0.7, enabled: true, label: 'HIGH' },
            ],
            outputGain: 0,
          }
        : undefined,
    compressorConfig:
      type === 'compressor'
        ? {
            threshold: -20,
            ratio: 4,
            attack: 0.01,
            release: 0.15,
            knee: 5,
            makeupGain: 0,
            mix: 1.0,
            sidechainEnabled: false,
            sidechainSourceId: null,
            sidechainGain: 1.0,
          }
        : undefined,
    multibandCompressorConfig:
      type === 'multiband_compressor'
        ? {
            crossoverLow: 150,
            crossoverHigh: 2500,
            lowBand: { threshold: -20, ratio: 3.5, attack: 0.02, release: 0.18, makeupGain: 0 },
            midBand: { threshold: -18, ratio: 2.5, attack: 0.015, release: 0.12, makeupGain: 0 },
            highBand: { threshold: -16, ratio: 2.0, attack: 0.008, release: 0.08, makeupGain: 0 },
            outputGain: 1.0,
            mix: 1.0,
            sidechainEnabled: false,
            sidechainSourceId: null,
            sidechainBands: 'all',
          }
        : undefined,
    limiterConfig:
      type === 'limiter'
        ? {
            ceiling: -0.1,
            threshold: -2.0,
            release: 0.05,
            lookaheadMs: 3,
            softClip: true,
            makeupGain: 0,
          }
        : undefined,
    reverbConfig:
      type === 'reverb'
        ? {
            decayTime: 2.5,
            predelay: 20,
            damping: 6000,
            roomSize: 0.7,
            stereoWidth: 1.0,
            wetMix: 0.35,
            dryMix: 1.0,
          }
        : undefined,
    saturationConfig:
      type === 'saturation'
        ? {
            drive: 1.8,
            saturationType: 'tape',
            tone: 8500,
            outputGain: 1.0,
            wetMix: 1.0,
          }
        : undefined,
  };
}

export function createCombinerNode(
  index: number,
  inputCount = 3,
  position?: [number, number, number],
  signalType: SignalKind = 'all'
): CombinerNode {
  const colorMap: Record<SignalKind, string> = {
    all: '#ec4899',
    midi: '#06b6d4',
    audio: '#f43f5e',
    audio_mono: '#06b6d4',
    audio_stereo: '#ec4899',
    trigger: '#fbbf24',
    trigger_stream: '#f59e0b',
    trigger_packet: '#f97316',
    curve: '#22d3ee',
    component: '#10b981',
  };
  return {
    id: `comb-${Date.now()}`,
    type: 'combiner',
    name: `${signalType.toUpperCase()} Combiner ${index}`,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: colorMap[signalType] || '#ec4899',
    radius: 1.5,
    label: `${signalType.toUpperCase()} Signal Combiner`,
    active: true,
    signalType,
    inputCount: Math.max(2, Math.min(8, inputCount)),
    combineMode: 'sum',
    gain: 1.0,
  };
}

export function createMultiplexerNode(
  index: number,
  outputCount = 4,
  position?: [number, number, number],
  signalType: SignalKind = 'all'
): MultiplexerNode {
  const colorMap: Record<SignalKind, string> = {
    all: '#3b82f6',
    midi: '#06b6d4',
    audio: '#f43f5e',
    audio_mono: '#06b6d4',
    audio_stereo: '#ec4899',
    trigger: '#fbbf24',
    trigger_stream: '#f59e0b',
    trigger_packet: '#f97316',
    curve: '#22d3ee',
    component: '#10b981',
  };
  return {
    id: `mux-${Date.now()}`,
    type: 'multiplexer',
    name: `${signalType.toUpperCase()} Multiplexer ${index}`,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: colorMap[signalType] || '#06b6d4',
    radius: 1.5,
    label: `${signalType.toUpperCase()} Signal Multiplexer`,
    active: true,
    signalType,
    outputCount: Math.max(2, Math.min(8, outputCount)),
    distributionMode: 'broadcast',
    activeChannel: 0,
    gain: 1.0,
  };
}

export function createModuleNode(
  index: number,
  name?: string,
  position?: [number, number, number],
  presetTemplate?: {
    name?: string;
    description?: string;
    category?: string;
    innerNodes?: SpaceNode[];
    innerConnections?: NodeConnection[];
    exposedInputs?: ModuleSocketMapping[];
    exposedOutputs?: ModuleSocketMapping[];
    color?: string;
  }
): ModuleNode {
  const modId = `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const modName = name || presetTemplate?.name || `Module Flow ${index}`;
  
  if (presetTemplate && presetTemplate.innerNodes && presetTemplate.innerNodes.length > 0) {
    // Clone preset internal graph with fresh IDs to prevent collisions
    const idMap = new Map<string, string>();
    const clonedNodes: SpaceNode[] = presetTemplate.innerNodes.map((n) => {
      const newId = `${n.id.split('-')[0]}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      idMap.set(n.id, newId);
      return JSON.parse(JSON.stringify({ ...n, id: newId }));
    });

    const clonedConnections: NodeConnection[] = (presetTemplate.innerConnections || []).map((c) => ({
      ...c,
      id: `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fromNodeId: idMap.get(c.fromNodeId) || c.fromNodeId,
      toNodeId: idMap.get(c.toNodeId) || c.toNodeId,
    }));

    const clonedInputs: ModuleSocketMapping[] = (presetTemplate.exposedInputs || []).map((exp, idx) => ({
      ...exp,
      id: `map-in-${Date.now()}-${idx}`,
      innerNodeId: idMap.get(exp.innerNodeId) || exp.innerNodeId,
      moduleSocketIndex: idx,
    }));

    const clonedOutputs: ModuleSocketMapping[] = (presetTemplate.exposedOutputs || []).map((exp, idx) => ({
      ...exp,
      id: `map-out-${Date.now()}-${idx}`,
      innerNodeId: idMap.get(exp.innerNodeId) || exp.innerNodeId,
      moduleSocketIndex: idx,
    }));

    return {
      id: modId,
      type: 'module',
      name: modName,
      label: modName,
      position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
      color: presetTemplate.color || '#8b5cf6',
      radius: 1.8,
      description: presetTemplate.description || 'Self-contained sub-graph signal flow container',
      category: presetTemplate.category || 'Custom Module',
      active: true,
      innerNodes: clonedNodes,
      innerConnections: clonedConnections,
      exposedInputs: clonedInputs,
      exposedOutputs: clonedOutputs,
    };
  }

  // Default empty module scaffold with internal Beats Sequencer & Synth Container
  const defaultInnerClock = createTriggerNode(1, [-3, 0, 0], 'beats');
  defaultInnerClock.name = 'Sub-Beats Sequencer';

  const defaultInnerContainer = createContainerNode('midi', 1, 120, [3, 0, 0]);
  defaultInnerContainer.name = 'Sub-Harmony Synth';

  const defaultInnerWire: NodeConnection = {
    id: `wire-${Date.now()}-1`,
    fromNodeId: defaultInnerClock.id,
    toNodeId: defaultInnerContainer.id,
    toPort: 'capture',
    signalType: 'trigger',
    latencyBeats: 0,
    dryMix: 1.0,
    wetMix: 1.0,
    signalGain: 1.0,
  };

  const defaultInputs: ModuleSocketMapping[] = [
    {
      id: `map-in-${Date.now()}-0`,
      direction: 'input',
      innerNodeId: defaultInnerClock.id,
      innerPortId: 'clock_sync',
      label: 'Clock Sync In',
      signalType: 'trigger',
      moduleSocketIndex: 0,
    },
    {
      id: `map-in-${Date.now()}-1`,
      direction: 'input',
      innerNodeId: defaultInnerContainer.id,
      innerPortId: 'capture',
      label: 'Gate / Note In',
      signalType: 'trigger',
      moduleSocketIndex: 1,
    },
  ];

  const defaultOutputs: ModuleSocketMapping[] = [
    {
      id: `map-out-${Date.now()}-0`,
      direction: 'output',
      innerNodeId: defaultInnerContainer.id,
      label: 'MIDI / Audio Out',
      signalType: 'midi',
      moduleSocketIndex: 0,
    },
  ];

  return {
    id: modId,
    type: 'module',
    name: modName,
    label: modName,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: '#8b5cf6',
    radius: 1.8,
    description: 'Containerized modular flow with configurable dynamic I/O sockets',
    category: 'Modular Flow',
    active: true,
    innerNodes: [defaultInnerClock, defaultInnerContainer],
    innerConnections: [defaultInnerWire],
    exposedInputs: defaultInputs,
    exposedOutputs: defaultOutputs,
  };
}

export function createModuleNodeFromPreset(
  presetTemplate: any,
  index: number,
  position?: [number, number, number]
): ModuleNode {
  return createModuleNode(index, presetTemplate.name, position, presetTemplate);
}

export function createGroupNode(
  index: number,
  groupName?: string,
  position?: [number, number, number],
  innerNodes: SpaceNode[] = [],
  innerConnections: NodeConnection[] = []
): GroupNode {
  const gName = groupName || `Group ${index + 1}`;
  return {
    id: `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'group',
    name: gName,
    label: gName,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: '#8b5cf6',
    radius: 1.8,
    description: 'Collapsed node group preserving internal node network',
    category: 'Node Group',
    active: true,
    innerNodes,
    innerConnections,
    exposedInputs: [],
    exposedOutputs: [],
  };
}

/**
 * Reclassified collapsed-node mechanism:
 * Consolidates a selection of nodes & internal wires into a new GroupNode.
 * GroupNode = collapsed UI/container representation of an existing collection of graph nodes,
 * preserves internal node group, NOT a reusable graph invocation.
 */
export function consolidateNodesIntoGroup(
  selectedNodeIds: string[],
  allNodes: SpaceNode[],
  allConnections: NodeConnection[],
  groupName = 'Node Group'
): {
  newGroup: GroupNode;
  remainingNodes: SpaceNode[];
  remainingConnections: NodeConnection[];
} {
  const selectedSet = new Set(selectedNodeIds);
  const innerNodes = allNodes.filter((n) => selectedSet.has(n.id));
  const remainingNodes = allNodes.filter((n) => !selectedSet.has(n.id));

  // Compute centroid position for the new group
  let avgX = 0;
  let avgY = 0;
  let avgZ = 0;
  if (innerNodes.length > 0) {
    innerNodes.forEach((n) => {
      avgX += n.position[0];
      avgY += n.position[1];
      avgZ += n.position[2];
    });
    avgX /= innerNodes.length;
    avgY /= innerNodes.length;
    avgZ /= innerNodes.length;
  }

  const innerConnections: NodeConnection[] = [];
  const outerConnections: NodeConnection[] = [];
  const exposedInputs: ModuleSocketMapping[] = [];
  const exposedOutputs: ModuleSocketMapping[] = [];

  const grpId = `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  allConnections.forEach((conn) => {
    const fromIn = selectedSet.has(conn.fromNodeId);
    const toIn = selectedSet.has(conn.toNodeId);

    if (fromIn && toIn) {
      // Internal wire within group
      innerConnections.push(conn);
    } else if (!fromIn && toIn) {
      // Inbound wire across boundary: create exposed input socket on group
      const targetInnerNode = innerNodes.find((n) => n.id === conn.toNodeId);
      const inputIdx = exposedInputs.length;
      const socketId = `grp-in-${Date.now()}-${inputIdx}`;
      exposedInputs.push({
        id: socketId,
        direction: 'input',
        innerNodeId: conn.toNodeId,
        innerPortId: conn.toPort,
        label: `${targetInnerNode?.name || 'Node'} In`,
        signalType: conn.signalType || 'trigger',
        moduleSocketIndex: inputIdx,
      });

      // Rewire outer connection to the group
      outerConnections.push({
        ...conn,
        toNodeId: grpId,
        toSocketIndex: inputIdx,
      });
    } else if (fromIn && !toIn) {
      // Outbound wire across boundary: create exposed output socket on group
      const sourceInnerNode = innerNodes.find((n) => n.id === conn.fromNodeId);
      const outputIdx = exposedOutputs.length;
      const socketId = `grp-out-${Date.now()}-${outputIdx}`;
      exposedOutputs.push({
        id: socketId,
        direction: 'output',
        innerNodeId: conn.fromNodeId,
        label: `${sourceInnerNode?.name || 'Node'} Out`,
        signalType: conn.signalType || 'midi',
        moduleSocketIndex: outputIdx,
      });

      // Rewire outer connection from the group
      outerConnections.push({
        ...conn,
        fromNodeId: grpId,
      });
    } else {
      // Completely outside wire
      outerConnections.push(conn);
    }
  });

  const newGroup: GroupNode = {
    id: grpId,
    type: 'group',
    name: groupName,
    position: [avgX, 0, avgZ],
    color: '#8b5cf6',
    radius: 1.8,
    label: groupName,
    description: `Collapsed node group containing ${innerNodes.length} nodes and ${innerConnections.length} conduits`,
    active: true,
    innerNodes,
    innerConnections,
    exposedInputs,
    exposedOutputs,
  };

  return {
    newGroup,
    remainingNodes: [...remainingNodes, newGroup],
    remainingConnections: outerConnections,
  };
}

/**
 * Consolidates a selection of nodes & internal wires into a new ModuleNode/GroupNode,
 * auto-detecting boundaries to create exposed inputs and outputs.
 * Preserved for backwards compatibility with GroupNode reclassification.
 */
export function consolidateNodesIntoModule(
  selectedNodeIds: string[],
  allNodes: SpaceNode[],
  allConnections: NodeConnection[],
  moduleName = 'Consolidated Module'
): {
  newModule: ModuleNode;
  remainingNodes: SpaceNode[];
  remainingConnections: NodeConnection[];
} {
  const { newGroup, remainingNodes, remainingConnections } = consolidateNodesIntoGroup(
    selectedNodeIds,
    allNodes,
    allConnections,
    moduleName
  );

  return {
    newModule: newGroup as unknown as ModuleNode,
    remainingNodes,
    remainingConnections,
  };
}

/**
 * Instantiates a reusable SubgraphNode from a GraphDefinition.
 * Dynamically derives exposed logical Stream handles from the invoked graph's physical I/O.
 */
export function createSubgraphNode(
  graphDef: GraphDefinition,
  position?: [number, number, number]
): SubgraphNode {
  return instantiateSubgraphSpaceNode(graphDef, position);
}

export function createControlNode(
  index: number,
  position?: [number, number, number],
  name?: string
): ControlNode {
  const defaultElements: ControlElement[] = [
    {
      id: `ctrl-elem-slider-1`,
      type: 'slider',
      label: 'Filter Cutoff',
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      value: 800,
      min: 50,
      max: 12000,
      step: 10,
      color: '#06b6d4',
      binding: {
        payloadType: 'synth_param',
        synthParam: 'cutoff',
        oscLearn: { address: '/synth/cutoff' },
        midiLearn: { type: 'cc', controllerNumber: 74, channel: 1 },
      },
    },
    {
      id: `ctrl-elem-slider-2`,
      type: 'slider',
      label: 'Resonance / Q',
      x: 3,
      y: 0,
      w: 3,
      h: 4,
      value: 3.5,
      min: 0.1,
      max: 20.0,
      step: 0.1,
      color: '#3b82f6',
      binding: {
        payloadType: 'synth_param',
        synthParam: 'resonance',
        oscLearn: { address: '/synth/resonance' },
        midiLearn: { type: 'cc', controllerNumber: 71, channel: 1 },
      },
    },
    {
      id: `ctrl-elem-knob-1`,
      type: 'knob',
      label: 'Tempo Rate',
      x: 6,
      y: 0,
      w: 3,
      h: 4,
      value: 120,
      min: 60,
      max: 200,
      step: 1,
      color: '#f59e0b',
      binding: {
        payloadType: 'synth_param',
        synthParam: 'bpm',
        oscLearn: { address: '/transport/bpm' },
      },
    },
    {
      id: `ctrl-elem-button-1`,
      type: 'button',
      label: 'Clock Fire Pulse',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      value: false,
      isMomentary: true,
      color: '#10b981',
      binding: {
        payloadType: 'trigger_pulse',
        oscLearn: { address: '/trigger/pulse' },
      },
    },
    {
      id: `ctrl-elem-toggle-1`,
      type: 'toggle',
      label: 'Transport Mute',
      x: 9,
      y: 2,
      w: 3,
      h: 2,
      value: false,
      color: '#ec4899',
      binding: {
        payloadType: 'midi_cc',
        midiCC: 64,
        midiChannel: 1,
        oscLearn: { address: '/transport/mute' },
      },
    },
    {
      id: `ctrl-elem-xy-1`,
      type: 'xy_pad',
      label: 'Spatial Orbit (X/Y)',
      x: 0,
      y: 4,
      w: 6,
      h: 4,
      value: [0.5, 0.5],
      color: '#a855f7',
      binding: {
        payloadType: 'curve_value',
        oscLearn: { address: '/spatial/xy' },
      },
    },
    {
      id: `ctrl-elem-pads-1`,
      type: 'pad_matrix',
      label: 'Sample Drum Triggers',
      x: 6,
      y: 4,
      w: 6,
      h: 4,
      value: 0,
      color: '#f43f5e',
      binding: {
        payloadType: 'midi_note',
        midiChannel: 10,
        midiNote: 36,
        midiVelocity: 110,
        oscLearn: { address: '/drums/pad' },
      },
    },
  ];

  return {
    id: `control-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'control',
    name: name || `Control Node ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#06b6d4',
    radius: 1.8,
    label: name || 'Custom UI Control Panel',
    active: true,
    isEditMode: false,
    elements: defaultElements,
    gridColumns: 12,
    gridRows: 8,
    theme: 'cyan_neon' as any,
  };
}

/**
 * Factory for Code Nodes (Trigger Stream Processor with Custom Code Payload)
 */
export function createCodeNode(
  index: number = 1,
  position?: [number, number, number],
  name?: string
): CodeNode {
  return {
    id: `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'code',
    name: name || `Code Node ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#f59e0b',
    radius: 1.5,
    active: true,
    code: DEFAULT_CODE_NODE_SCRIPT,
    width: 380,
    height: 260,
    executionMode: 'on_pulse',
    totalPulsesProcessed: 0,
    lastErrorMessage: null,
  };
}

/**
 * Factory for String Primitive Nodes
 */
export function createStringNode(
  index: number = 1,
  position?: [number, number, number],
  initialValue?: string,
  name?: string
): StringNode {
  return {
    id: `str-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'primitive_string',
    name: name || `String ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#06b6d4',
    radius: 1.2,
    active: true,
    value: initialValue,
    label: 'String Primitive',
  };
}

/**
 * Factory for Number Primitive Nodes
 */
export function createNumberNode(
  index: number = 1,
  position?: [number, number, number],
  initialValue?: number,
  name?: string
): NumberNode {
  return {
    id: `num-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'primitive_number',
    name: name || `Number ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#f97316',
    radius: 1.2,
    active: true,
    value: initialValue,
    min: 0,
    max: 128,
    step: 1,
    label: 'Number Primitive',
  };
}

/**
 * Factory for Boolean Primitive Nodes
 */
export function createBooleanNode(
  index: number = 1,
  position?: [number, number, number],
  initialValue: boolean = true,
  name?: string
): BooleanNode {
  return {
    id: `bool-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'primitive_boolean',
    name: name || `Boolean ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#a855f7',
    radius: 1.0,
    active: true,
    value: initialValue,
    label: 'Boolean Primitive',
  };
}

/**
 * Factory for Object / JSON Primitive Nodes
 */
export function createObjectNode(
  index: number = 1,
  position?: [number, number, number],
  initialValue?: Record<string, any>,
  name?: string
): ObjectNode {
  return {
    id: `obj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'primitive_object',
    name: name || `Object ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#3b82f6',
    radius: 1.4,
    active: true,
    value: initialValue,
    rawJson: initialValue ? JSON.stringify(initialValue, null, 2) : undefined,
    label: 'Object / JSON',
  };
}

/**
 * Factory for Dedicated Folder Path Access Nodes
 * Gets user defined folders as a list and outputs them as a structured object
 */
export function createFolderPathNode(
  index: number = 1,
  position?: [number, number, number],
  scope: AssetPoolScope = 'workspace',
  name?: string
): FolderPathNode {
  return {
    id: `folder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'folder_path',
    name: name || `Folder Path ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#ec4899',
    radius: 1.5,
    active: true,
    scope,
    selectedFolder: undefined,
    folders: [],
    label: 'Folder Path Access',
  };
}

export { createArrangementNode } from './arrangementFactory';
