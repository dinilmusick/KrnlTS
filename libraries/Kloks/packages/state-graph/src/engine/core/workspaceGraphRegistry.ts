import { GraphDefinition, SubgraphNode, SubgraphHandle, SignalType, UniversalSocketDefinition, DawProject } from "../types/index.js";
import { createPackagedSocket } from './nodeSocketRegistry';

const STORAGE_KEY_GRAPHS = 'qwnsr_workspace_graphs';

export const DEFAULT_WORKSPACE_GRAPHS: GraphDefinition[] = [];

export function convertProjectToGraphDefinition(proj: DawProject): GraphDefinition {
  const mapInputs = proj.mapIoConfig?.inputs || [];
  const mapOutputs = proj.mapIoConfig?.outputs || [];

  const physicalInputs = mapInputs.length > 0
    ? mapInputs.map((inp, idx) => {
        const isAudio = inp.type === 'audio';
        const isMidi = inp.type === 'midi';
        const isMono = inp.audioFormat === 'mono' || inp.signalType?.includes('mono');
        return {
          id: inp.id || `in_${idx}`,
          name: inp.name || (isAudio ? (isMono ? 'Audio Mono' : 'Audio Stereo') : isMidi ? 'MIDI' : 'Trigger'),
          type: isAudio ? 'Audio' : isMidi ? 'MIDI' : 'Trigger',
          channels: isAudio ? (isMono ? 'Mono' : 'Stereo') : undefined,
        };
      })
    : [
        { id: `${proj.id}-in-stereo`, name: 'Audio Stereo', type: 'Audio', channels: 'Stereo' },
        { id: `${proj.id}-in-mono`, name: 'Audio Mono', type: 'Audio', channels: 'Mono' },
        { id: `${proj.id}-in-midi`, name: 'MIDI', type: 'MIDI' },
      ];

  const physicalOutputs = mapOutputs.length > 0
    ? mapOutputs.map((outp, idx) => {
        const isAudio = outp.type === 'audio';
        const isMidi = outp.type === 'midi';
        const isMono = outp.audioFormat === 'mono' || outp.signalType?.includes('mono');
        return {
          id: outp.id || `out_${idx}`,
          name: outp.name || (isAudio ? (isMono ? 'Audio Mono' : 'Audio Stereo') : isMidi ? 'MIDI' : 'Trigger'),
          type: isAudio ? 'Audio' : isMidi ? 'MIDI' : 'Trigger',
          channels: isAudio ? (isMono ? 'Mono' : 'Stereo') : undefined,
        };
      })
    : [
        { id: `${proj.id}-out-stereo`, name: 'Audio Stereo', type: 'Audio', channels: 'Stereo' },
      ];

  return {
    id: proj.id,
    name: proj.name,
    description: proj.description || `Workspace graph: ${proj.name}`,
    physicalInputs,
    physicalOutputs,
    nodes: proj.nodes || [],
    connections: proj.connections || [],
    bpm: proj.bpm,
  };
}

/**
 * Determines whether candidateGraph can be instantiated as a SubgraphNode inside activeGraph.
 * 
 * Rules:
 * 1. Excludes self (candidateGraph.id or candidateGraph.name matches activeGraphIdOrName).
 * 2. Excludes all graphs that import self directly or transitively (prevents cyclic dependencies).
 */
export function isGraphImportable(
  candidateGraph: GraphDefinition,
  activeGraphIdOrName: string | undefined,
  allWorkspaceGraphs: GraphDefinition[]
): boolean {
  if (!activeGraphIdOrName || !activeGraphIdOrName.trim()) {
    return true;
  }

  const activeLower = activeGraphIdOrName.trim().toLowerCase();
  const candIdLower = (candidateGraph.id || '').trim().toLowerCase();
  const candNameLower = (candidateGraph.name || '').trim().toLowerCase();

  // Rule 1: Exclude self
  if (candIdLower === activeLower || candNameLower === activeLower) {
    return false;
  }

  // Build lookup map of all workspace graphs by id and name (lowercase)
  const graphMap = new Map<string, GraphDefinition>();
  allWorkspaceGraphs.forEach((g) => {
    if (g.id) graphMap.set(g.id.trim().toLowerCase(), g);
    if (g.name) graphMap.set(g.name.trim().toLowerCase(), g);
  });

  // Helper to check if fromGraph contains a SubgraphNode referencing targetKey
  const importsTargetDirectly = (fromGraph: GraphDefinition, targetKey: string): boolean => {
    const nodes = (fromGraph.nodes || []) as any[];
    return nodes.some((node) => {
      if (!node || node.type !== 'subgraph') return false;
      const gId = (node.graphId || '').trim().toLowerCase();
      const gName = (node.graphName || '').trim().toLowerCase();
      const refId = (node.reference?.id || '').trim().toLowerCase();
      const refName = (node.reference?.name || '').trim().toLowerCase();
      const nName = (node.name || '').trim().toLowerCase();

      return (
        gId === targetKey ||
        gName === targetKey ||
        refId === targetKey ||
        refName === targetKey ||
        nName === targetKey
      );
    });
  };

  // Traces whether graphToCheck imports active graph directly or transitively
  const visited = new Set<string>();

  const graphImportsActive = (graphToCheck: GraphDefinition): boolean => {
    const key = (graphToCheck.id || graphToCheck.name || '').trim().toLowerCase();
    if (!key || visited.has(key)) return false;
    visited.add(key);

    // Direct import check
    if (importsTargetDirectly(graphToCheck, activeLower)) {
      return true;
    }

    // Transitive import check
    const nodes = (graphToCheck.nodes || []) as any[];
    for (const node of nodes) {
      if (!node || node.type !== 'subgraph') continue;
      const targetSubKey = (
        node.graphId ||
        node.graphName ||
        node.reference?.id ||
        node.reference?.name ||
        node.name ||
        ''
      ).trim().toLowerCase();

      if (!targetSubKey) continue;

      const subGraph = graphMap.get(targetSubKey);
      if (subGraph && graphImportsActive(subGraph)) {
        return true;
      }
    }

    return false;
  };

  return !graphImportsActive(candidateGraph);
}

export class WorkspaceGraphRegistry {
  private static inMemoryGraphs: Map<string, GraphDefinition> = new Map();

  static {
    // Populate default graphs
    DEFAULT_WORKSPACE_GRAPHS.forEach((g) => {
      this.inMemoryGraphs.set(g.id, g);
      this.inMemoryGraphs.set(g.name, g);
    });

    // Load persisted graphs if in browser
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_GRAPHS);
        if (raw) {
          const list: GraphDefinition[] = JSON.parse(raw);
          list.forEach((g) => {
            this.inMemoryGraphs.set(g.id, g);
            this.inMemoryGraphs.set(g.name, g);
          });
        }
      } catch (e) {
        console.warn('Failed to load workspace graphs from storage', e);
      }
    }
  }

  public static syncWorkspaceProjects(projects: DawProject[]): void {
    this.inMemoryGraphs.clear();
    if (projects && projects.length > 0) {
      projects.forEach((proj) => {
        const gDef = convertProjectToGraphDefinition(proj);
        this.inMemoryGraphs.set(gDef.id, gDef);
        this.inMemoryGraphs.set(gDef.name, gDef);
      });
    }
    this.persistToLocalStorage();
  }

  public static saveWorkspaceProject(proj: DawProject): void {
    const gDef = convertProjectToGraphDefinition(proj);
    this.saveWorkspaceGraph(gDef);
  }

  public static getWorkspaceGraphs(): GraphDefinition[] {
    const unique = new Map<string, GraphDefinition>();
    this.inMemoryGraphs.forEach((g) => unique.set(g.id, g));
    return Array.from(unique.values());
  }

  public static getGraphDefinition(idOrName: string): GraphDefinition | undefined {
    return this.inMemoryGraphs.get(idOrName);
  }

  public static saveWorkspaceGraph(graph: GraphDefinition): void {
    this.inMemoryGraphs.set(graph.id, graph);
    this.inMemoryGraphs.set(graph.name, graph);
    this.persistToLocalStorage();
  }

  public static deleteWorkspaceGraph(id: string): void {
    const existing = this.inMemoryGraphs.get(id);
    if (existing) {
      this.inMemoryGraphs.delete(existing.id);
      this.inMemoryGraphs.delete(existing.name);
      this.persistToLocalStorage();
    }
  }

  private static persistToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const all = this.getWorkspaceGraphs();
        localStorage.setItem(STORAGE_KEY_GRAPHS, JSON.stringify(all));
      } catch (e) {
        console.warn('Failed to save workspace graphs to storage', e);
      }
    }
  }
}

/**
 * Normalizes channels: 'mono' -> 'Mono', 'stereo' -> 'Stereo'
 */
function normalizeChannelCasing(channels?: string): 'Mono' | 'Stereo' | undefined {
  if (!channels) return undefined;
  const lower = channels.toLowerCase();
  if (lower === 'mono') return 'Mono';
  if (lower === 'stereo') return 'Stereo';
  return channels as any;
}

/**
 * Normalizes data type: 'audio' -> 'Audio', 'midi' -> 'MIDI'
 */
function normalizeTypeCasing(type: string): string {
  const lower = type.toLowerCase();
  if (lower === 'audio') return 'Audio';
  if (lower === 'midi') return 'MIDI';
  if (lower === 'trigger') return 'Trigger';
  if (lower === 'curve') return 'Curve';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Core I/O Transformation for Instantiating a SubgraphNode:
 * Converts a GraphDefinition into a runtime SpaceNode SubgraphNode.
 * 
 * Rules:
 * 1. PhysicalInput -> preserve data type, preserve channel semantics, force variant = STREAM -> InputHandle
 * 2. PhysicalOutput -> preserve data type, preserve channel semantics, force variant = STREAM -> OutputHandle
 * 3. Never derive: PhysicalInput -> Packet, PhysicalOutput -> Packet
 * 4. node.reference = graphDefinition
 */
export function instantiateSubgraphSpaceNode(
  graphDef: GraphDefinition,
  position: [number, number, number] = [0, 0, 0]
): SubgraphNode {
  const nodeId = `subgraph-${graphDef.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 1. Transform physical inputs -> InputHandles (forced variant = Stream)
  const inputHandles: SubgraphHandle[] = (graphDef.physicalInputs || []).map((pin, idx) => {
    const normType = normalizeTypeCasing(pin.type);
    const normChannels = normalizeChannelCasing(pin.channels);
    const dataType = normChannels ? `${normType}.${normChannels}.Stream` : `${normType}.Stream`;
    const label = `${normType}${normChannels ? ' ' + normChannels : ''} Stream IN`;
    const isAudio = normType === 'Audio';
    const isMidi = normType === 'MIDI';
    const isMono = normChannels === 'Mono';

    let sigType: SignalType = 'trigger';
    if (isAudio) sigType = isMono ? 'audio_mono' : 'audio_stereo';
    else if (isMidi) sigType = 'midi_stream';
    else if (normType === 'Curve') sigType = 'curve_stream';

    return {
      id: pin.id || `in_${normType.toLowerCase()}_${normChannels ? normChannels.toLowerCase() + '_' : ''}${idx}`,
      name: pin.name || normType,
      label,
      direction: 'input',
      dataType,
      type: normType,
      channels: normChannels,
      variant: 'Stream', // ALWAYS Stream! Never Packet
      signalType: sigType,
      socketIndex: idx,
    };
  });

  // 2. Transform physical outputs -> OutputHandles (forced variant = Stream)
  const outputHandles: SubgraphHandle[] = (graphDef.physicalOutputs || []).map((pout, idx) => {
    const normType = normalizeTypeCasing(pout.type);
    const normChannels = normalizeChannelCasing(pout.channels);
    const dataType = normChannels ? `${normType}.${normChannels}.Stream` : `${normType}.Stream`;
    const label = `${normType}${normChannels ? ' ' + normChannels : ''} Stream OUT`;
    const isAudio = normType === 'Audio';
    const isMidi = normType === 'MIDI';
    const isMono = normChannels === 'Mono';

    let sigType: SignalType = 'trigger';
    if (isAudio) sigType = isMono ? 'audio_mono' : 'audio_stereo';
    else if (isMidi) sigType = 'midi_stream';
    else if (normType === 'Curve') sigType = 'curve_stream';

    return {
      id: pout.id || `out_${normType.toLowerCase()}_${normChannels ? normChannels.toLowerCase() + '_' : ''}${idx}`,
      name: pout.name || normType,
      label,
      direction: 'output',
      dataType,
      type: normType,
      channels: normChannels,
      variant: 'Stream', // ALWAYS Stream! Never Packet
      signalType: sigType,
      socketIndex: idx,
    };
  });

  // 3. Build custom sockets for canvas rendering
  const customSockets: UniversalSocketDefinition[] = [
    ...inputHandles.map((h) => {
      const isAudio = h.type === 'Audio';
      const isMidi = h.type === 'MIDI';
      const isMono = h.channels === 'Mono';
      return createPackagedSocket({
        socketId: h.id,
        label: h.label,
        polarity: 'input',
        medium: isAudio ? (isMono ? 'audio_mono' : 'audio_stereo') : isMidi ? 'midi' : 'trigger',
        dataType: 'stream',
        signalType: h.signalType,
        connectivity: 'single',
        socketIndex: h.socketIndex,
        description: `Subgraph Stream Input: ${h.label}`,
      });
    }),
    ...outputHandles.map((h) => {
      const isAudio = h.type === 'Audio';
      const isMidi = h.type === 'MIDI';
      const isMono = h.channels === 'Mono';
      return createPackagedSocket({
        socketId: h.id,
        label: h.label,
        polarity: 'output',
        medium: isAudio ? (isMono ? 'audio_mono' : 'audio_stereo') : isMidi ? 'midi' : 'trigger',
        dataType: 'stream',
        signalType: h.signalType,
        connectivity: 'multi',
        socketIndex: h.socketIndex,
        description: `Subgraph Stream Output: ${h.label}`,
      });
    }),
  ];

  return {
    id: nodeId,
    type: 'subgraph',
    name: graphDef.name,
    position,
    color: '#06b6d4',
    radius: 1.8,
    label: graphDef.name,
    active: true,
    graphId: graphDef.id,
    graphName: graphDef.name,
    reference: graphDef,
    inputHandles,
    outputHandles,
    customSockets,
  };
}
