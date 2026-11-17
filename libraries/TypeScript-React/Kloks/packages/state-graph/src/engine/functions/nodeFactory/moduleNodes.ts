import { SpaceNode, NodeConnection, ModuleSocketMapping, ModuleNode } from "../../types/index.js";
import { createTriggerNode } from './triggerNodes';
import { createContainerNode } from '../containerFactory';

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
      innerPortId: 'playback_midi',
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
  const selectedSet = new Set(selectedNodeIds);
  const innerNodes = allNodes.filter((n) => selectedSet.has(n.id));
  const remainingNodes = allNodes.filter((n) => !selectedSet.has(n.id));

  // Compute centroid position for the new module
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

  const modId = `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  allConnections.forEach((conn) => {
    const fromIn = selectedSet.has(conn.fromNodeId);
    const toIn = selectedSet.has(conn.toNodeId);

    if (fromIn && toIn) {
      // Internal wire
      innerConnections.push(conn);
    } else if (!fromIn && toIn) {
      // Inbound wire across boundary: create exposed input socket on module!
      const targetInnerNode = innerNodes.find((n) => n.id === conn.toNodeId);
      const inputIdx = exposedInputs.length;
      const socketId = `map-in-${Date.now()}-${inputIdx}`;
      exposedInputs.push({
        id: socketId,
        direction: 'input',
        innerNodeId: conn.toNodeId,
        innerPortId: conn.toPort,
        label: `${targetInnerNode?.name || 'Node'} In`,
        signalType: conn.signalType || 'trigger',
        moduleSocketIndex: inputIdx,
      });

      // Rewire outer connection to the module
      outerConnections.push({
        ...conn,
        toNodeId: modId,
        toSocketIndex: inputIdx,
      });
    } else if (fromIn && !toIn) {
      // Outbound wire across boundary: create exposed output socket on module!
      const sourceInnerNode = innerNodes.find((n) => n.id === conn.fromNodeId);
      const outputIdx = exposedOutputs.length;
      const socketId = `map-out-${Date.now()}-${outputIdx}`;
      exposedOutputs.push({
        id: socketId,
        direction: 'output',
        innerNodeId: conn.fromNodeId,
        label: `${sourceInnerNode?.name || 'Node'} Out`,
        signalType: conn.signalType || 'midi',
        moduleSocketIndex: outputIdx,
      });

      // Rewire outer connection from the module
      outerConnections.push({
        ...conn,
        fromNodeId: modId,
      });
    } else {
      // Completely outside wire
      outerConnections.push(conn);
    }
  });

  const newModule: ModuleNode = {
    id: modId,
    type: 'module',
    name: moduleName,
    position: [avgX, 0, avgZ],
    color: '#8b5cf6',
    radius: 1.8,
    label: moduleName,
    description: `Consolidated subgraph containing ${innerNodes.length} nodes and ${innerConnections.length} conduits`,
    active: true,
    innerNodes,
    innerConnections,
    exposedInputs,
    exposedOutputs,
  };

  return {
    newModule,
    remainingNodes: [...remainingNodes, newModule],
    remainingConnections: outerConnections,
  };
}
