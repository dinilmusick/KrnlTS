/**
 * @file graphPackageService.ts
 * @description Server-side service for self-contained Graph Packages.
 * Enforces:
 * 1. Workspace is the top-level container.
 * 2. Each Graph is a self-contained package with dedicated directory, entry point, assets, and metadata.
 * 3. Extensible Graph Type System with granular classifications.
 * 4. Acyclic graph dependencies with strict cycle rejection.
 */

import fs from 'fs';
import path from 'path';
import { DawProject, SpaceNode, NodeConnection, validateGraphImport } from '@kloks/state-graph';
import { ensureGraphAssetDirectories, seedStarterGraphAssets } from './graphAssetService';

export type GraphType = string;
export type GraphPackageMetadata = Record<string, any>;
export type GraphPackage = Record<string, any>;

export const WORKSPACE_ROOT = path.join(process.cwd(), 'workspaces', 'default');
export const GRAPHS_ROOT = path.join(WORKSPACE_ROOT, 'graphs');
export const LEGACY_PROJECTS_ROOT = path.join(process.cwd(), 'projects');

export function ensureWorkspaceStructure(): void {
  if (!fs.existsSync(GRAPHS_ROOT)) {
    fs.mkdirSync(GRAPHS_ROOT, { recursive: true });
  }

  // Seed starter self-contained graph packages if workspace is empty
  seedStarterGraphsIfEmpty();
}

/**
 * Initializes default graph packages representing different graph types
 */
function seedStarterGraphsIfEmpty(): void {
  const existing = fs.existsSync(GRAPHS_ROOT) ? fs.readdirSync(GRAPHS_ROOT) : [];
  if (existing.length > 0) return;

  // 1. Intro / Motif Package
  const introId = 'intro-motif-starter';
  createInitialGraphPackageSync(
    introId,
    'Celestial Intro Motif',
    'Starter atmospheric intro ostinato and arpeggiated motif package',
    'intro_motif',
    120,
    0.85,
    'verdant_forest',
    [
      {
        id: 'input-strip-node',
        type: 'input_strip',
        name: 'INPUT STRIP',
        position: [-10, 0, 0],
        color: '#f59e0b',
        radius: 1.8,
        label: 'Landmark [0]',
        active: true,
      },
      {
        id: 'output-strip-node',
        type: 'output_strip',
        name: 'OUTPUT STRIP',
        position: [10, 0, 0],
        color: '#10b981',
        radius: 1.8,
        label: 'Landmark [1]',
        active: true,
      },
      {
        id: 'trig-1',
        type: 'trigger',
        name: 'Motif Clock 16th',
        position: [-6, 2, 0],
        triggerType: 'beats',
        intervalBeats: 1,
        divisionMode: 'every_beat',
        divisionsPerBeat: 1,
        stepsPerCycle: 4,
        activeSteps: [true, true, true, true],
        active: true,
        color: '#38bdf8',
        label: 'Motif Clock',
      },
      {
        id: 'cont-1',
        type: 'container',
        containerType: 'midi',
        name: 'Andromeda Lydian Pad',
        position: [2, 3, -1],
        color: '#38bdf8',
        radius: 1.8,
        isLooping: true,
        synthPreset: {
          synthType: 'pad',
          attack: 0.15,
          decay: 0.8,
          sustain: 0.7,
          release: 1.6,
          cutoff: 2400,
          resonance: 3,
          reverb: 0.6,
          delay: 0.4,
        },
        pattern: {
          id: 'pat-intro',
          name: 'Lydian Celestial Pad',
          lengthInBeats: 4,
          tempo: 120,
          notes: [
            { note: 60, name: 'C4', velocity: 0.85, time: 0, duration: 3.8 },
            { note: 64, name: 'E4', velocity: 0.8, time: 0, duration: 3.8 },
            { note: 67, name: 'G4', velocity: 0.8, time: 0, duration: 3.8 },
            { note: 71, name: 'B4', velocity: 0.75, time: 0, duration: 3.8 },
          ],
        },
      },
    ],
    [
      { id: 'conn-1', fromNodeId: 'trig-1', toNodeId: 'cont-1', latencyBeats: 0 },
      { id: 'conn-2', fromNodeId: 'cont-1', toNodeId: 'output-strip-node', fromPort: 'audio_out', toPort: 'in-map-out-audio-master', latencyBeats: 0 },
    ],
    []
  );

  // 2. Arrangement Package
  const arrId = 'arrangement-symphony';
  createInitialGraphPackageSync(
    arrId,
    'Symphonic Multitrack Arrangement',
    'Complete arrangement with timeline track lanes, curve automation, and stems',
    'arrangement',
    124,
    0.9,
    'arcane_valley',
    [
      {
        id: 'input-strip-node',
        type: 'input_strip',
        name: 'INPUT STRIP',
        position: [-12, 0, 0],
        color: '#f59e0b',
        radius: 1.8,
        label: 'Landmark [0]',
        active: true,
      },
      {
        id: 'output-strip-node',
        type: 'output_strip',
        name: 'OUTPUT STRIP',
        position: [12, 0, 0],
        color: '#10b981',
        radius: 1.8,
        label: 'Landmark [1]',
        active: true,
      },
      {
        id: 'arr-node-1',
        type: 'arrangement',
        name: 'Master Timeline Matrix',
        position: [0, 0, 0],
        color: '#a855f7',
        radius: 2.2,
        label: 'Arrangement',
        active: true,
        width: 580,
        height: 380,
        totalBars: 16,
        timeSignature: [4, 4],
        currentBeat: 0,
        tracks: [
          {
            id: 'arr-track-1',
            name: 'Intro Synth Pad',
            signalType: 'audio_stereo',
            color: '#38bdf8',
            clips: [],
          },
          {
            id: 'arr-track-2',
            name: 'Rhythm Percussion',
            signalType: 'trigger',
            color: '#f97316',
            clips: [],
          },
        ],
      },
    ],
    [
      { id: 'conn-arr-1', fromNodeId: 'arr-node-1', toNodeId: 'output-strip-node', latencyBeats: 0 },
    ],
    [introId] // Imports intro-motif
  );

  // 3. Song Package
  const songId = 'cyber-odyssey-song';
  createInitialGraphPackageSync(
    songId,
    'Cyber Odyssey Complete Song',
    'Full production song combining arrangement, beats, and synth lead sections',
    'song',
    128,
    0.88,
    'volcanic_citadel',
    [
      {
        id: 'input-strip-node',
        type: 'input_strip',
        name: 'INPUT STRIP',
        position: [-10, 0, 0],
        color: '#f59e0b',
        radius: 1.8,
        label: 'Landmark [0]',
        active: true,
      },
      {
        id: 'output-strip-node',
        type: 'output_strip',
        name: 'OUTPUT STRIP',
        position: [10, 0, 0],
        color: '#10b981',
        radius: 1.8,
        label: 'Landmark [1]',
        active: true,
      },
      {
        id: 'cont-boom',
        type: 'container',
        containerType: 'audio',
        name: '808 Sub Kick',
        position: [1, 2, 0],
        color: '#f43f5e',
        radius: 1.6,
        isLooping: true,
        audioTrack: {
          id: 'track-boom',
          name: '808 Sub Boom',
          sampleType: 'custom',
          customAudioUrl: `/graphs/${songId}/assets/audio/stereo/default/808_sub_boom.wav`,
          durationBeats: 4,
          gain: 1.0,
          pan: 0,
          pitchShift: 0,
          filterCutoff: 8000,
          fadeInBeats: 0,
          fadeOutBeats: 0,
          trimStartBeats: 0,
          trimEndBeats: 4,
          isReversed: false,
        },
      },
    ],
    [
      { id: 'conn-song-1', fromNodeId: 'cont-boom', toNodeId: 'output-strip-node', fromPort: 'audio_out', toPort: 'in-map-out-audio-master', latencyBeats: 0 },
    ],
    [introId]
  );

  // 4. Performance Package
  const perfId = 'live-performance-rig';
  createInitialGraphPackageSync(
    perfId,
    'Live Performance Matrix',
    'Real-time stage performance rig with responsive controls and pads',
    'performance',
    128,
    0.9,
    'autumn_highlands',
    [
      {
        id: 'input-strip-node',
        type: 'input_strip',
        name: 'INPUT STRIP',
        position: [-10, 0, 0],
        color: '#f59e0b',
        radius: 1.8,
        label: 'Landmark [0]',
        active: true,
      },
      {
        id: 'output-strip-node',
        type: 'output_strip',
        name: 'OUTPUT STRIP',
        position: [10, 0, 0],
        color: '#10b981',
        radius: 1.8,
        label: 'Landmark [1]',
        active: true,
      },
      {
        id: 'ctrl-1',
        type: 'control',
        name: 'Stage Macro Console',
        position: [0, 0, 0],
        color: '#10b981',
        radius: 2.0,
        label: 'Live Controller',
        active: true,
        isEditMode: false,
        gridColumns: 12,
        gridRows: 8,
        elements: [],
      },
    ],
    [
      { id: 'conn-perf-1', fromNodeId: 'ctrl-1', toNodeId: 'output-strip-node', latencyBeats: 0 },
    ],
    [songId]
  );
}

function createInitialGraphPackageSync(
  id: string,
  name: string,
  description: string,
  type: GraphType,
  bpm: number,
  masterVolume: number,
  currentBiome: string,
  nodes: SpaceNode[],
  connections: NodeConnection[],
  importedGraphIds: string[] = []
): void {
  const graphDir = path.join(GRAPHS_ROOT, id);
  if (!fs.existsSync(graphDir)) {
    fs.mkdirSync(graphDir, { recursive: true });
  }

  ensureGraphAssetDirectories(graphDir);
  seedStarterGraphAssets(graphDir);

  const metadata: GraphPackageMetadata = {
    id,
    name,
    description,
    type,
    version: '1.0.0',
    folderPath: `workspaces/default/graphs/${id}`,
    entryFile: 'graph.qms',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    importedGraphIds,
    bpm,
    masterVolume,
    currentBiome,
    nodeCount: nodes.length,
    assetCount: 6,
  };

  const graphPackage: GraphPackage = {
    format: 'qms_graph_package',
    version: '2.0.0',
    metadata,
    graph: {
      bpm,
      masterVolume,
      currentBiome,
      nodes,
      connections,
    },
  };

  fs.writeFileSync(path.join(graphDir, 'graph.qms'), JSON.stringify(graphPackage, null, 2), 'utf-8');
}

/**
 * List all graph packages in the workspace
 */
export async function listAllGraphPackages(): Promise<GraphPackageMetadata[]> {
  ensureWorkspaceStructure();
  const dirs = await fs.promises.readdir(GRAPHS_ROOT);
  const packages: GraphPackageMetadata[] = [];

  for (const dir of dirs) {
    const graphDir = path.join(GRAPHS_ROOT, dir);
    const stat = await fs.promises.stat(graphDir);
    if (!stat.isDirectory()) continue;

    const qmsFile = path.join(graphDir, 'graph.qms');
    const legacyProjectFile = path.join(graphDir, 'project.json');

    let packageData: GraphPackage | null = null;

    if (fs.existsSync(qmsFile)) {
      try {
        const raw = await fs.promises.readFile(qmsFile, 'utf-8');
        packageData = JSON.parse(raw);
      } catch (err) {
        console.warn(`Corrupted graph.qms in ${dir}:`, err);
      }
    } else if (fs.existsSync(legacyProjectFile)) {
      // Auto-migrate legacy project.json into graph.qms
      try {
        const raw = await fs.promises.readFile(legacyProjectFile, 'utf-8');
        const legacy = JSON.parse(raw);
        packageData = {
          format: 'qms_graph_package',
          version: '2.0.0',
          metadata: {
            id: legacy.id || dir,
            name: legacy.name || dir,
            description: legacy.description || '',
            type: (legacy.type as GraphType) || 'song',
            version: '1.0.0',
            folderPath: `workspaces/default/graphs/${dir}`,
            entryFile: 'graph.qms',
            createdAt: legacy.createdAt || stat.birthtimeMs,
            updatedAt: legacy.updatedAt || stat.mtimeMs,
            importedGraphIds: legacy.importedGraphIds || [],
            bpm: legacy.bpm || 120,
            masterVolume: legacy.masterVolume ?? 0.85,
            currentBiome: legacy.currentBiome || 'verdant_forest',
            nodeCount: Array.isArray(legacy.nodes) ? legacy.nodes.length : 0,
          },
          graph: {
            bpm: legacy.bpm || 120,
            masterVolume: legacy.masterVolume ?? 0.85,
            currentBiome: legacy.currentBiome || 'verdant_forest',
            nodes: legacy.nodes || [],
            connections: legacy.connections || [],
            mapIoConfig: legacy.mapIoConfig,
          },
        };
        await fs.promises.writeFile(qmsFile, JSON.stringify(packageData, null, 2), 'utf-8');
      } catch (err) {
        console.warn(`Failed to auto-migrate legacy project ${dir}:`, err);
      }
    }

    if (packageData && packageData.metadata) {
      packages.push({
        ...packageData.metadata,
        id: packageData.metadata.id || dir,
        name: packageData.metadata.name || dir,
        type: packageData.metadata.type || 'custom',
        importedGraphIds: packageData.metadata.importedGraphIds || [],
        folderPath: `workspaces/default/graphs/${dir}`,
        entryFile: 'graph.qms',
        nodeCount: Array.isArray(packageData.graph?.nodes) ? packageData.graph.nodes.length : 0,
      });
    }
  }

  return packages.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get full graph package by ID
 */
export async function getGraphPackageById(id: string): Promise<GraphPackage | null> {
  ensureWorkspaceStructure();
  const safeId = path.basename(id);
  const graphDir = path.join(GRAPHS_ROOT, safeId);
  const qmsFile = path.join(graphDir, 'graph.qms');

  if (!fs.existsSync(qmsFile)) {
    // Check legacy project fallback
    const legacyProject = path.join(LEGACY_PROJECTS_ROOT, safeId, 'project.json');
    if (fs.existsSync(legacyProject)) {
      const raw = await fs.promises.readFile(legacyProject, 'utf-8');
      const legacy = JSON.parse(raw);
      return {
        format: 'qms_graph_package',
        version: '2.0.0',
        metadata: {
          id: safeId,
          name: legacy.name || safeId,
          description: legacy.description || '',
          type: (legacy.type as GraphType) || 'song',
          version: '1.0.0',
          folderPath: `workspaces/default/graphs/${safeId}`,
          entryFile: 'graph.qms',
          createdAt: legacy.createdAt || Date.now(),
          updatedAt: legacy.updatedAt || Date.now(),
          importedGraphIds: legacy.importedGraphIds || [],
          bpm: legacy.bpm || 120,
          masterVolume: legacy.masterVolume ?? 0.85,
          currentBiome: legacy.currentBiome || 'verdant_forest',
          nodeCount: Array.isArray(legacy.nodes) ? legacy.nodes.length : 0,
        },
        graph: {
          bpm: legacy.bpm || 120,
          masterVolume: legacy.masterVolume ?? 0.85,
          currentBiome: legacy.currentBiome || 'verdant_forest',
          nodes: legacy.nodes || [],
          connections: legacy.connections || [],
          mapIoConfig: legacy.mapIoConfig,
        },
      };
    }
    return null;
  }

  const raw = await fs.promises.readFile(qmsFile, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Create a new self-contained Graph Package
 */
export async function createGraphPackage(params: {
  name: string;
  description?: string;
  type?: GraphType;
  customTypeTag?: string;
  bpm?: number;
  masterVolume?: number;
  currentBiome?: string;
  nodes?: SpaceNode[];
  connections?: NodeConnection[];
  importedGraphIds?: string[];
}): Promise<GraphPackage> {
  ensureWorkspaceStructure();

  const name = params.name.trim();
  const safeSlug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  const id = `${safeSlug}-${Date.now().toString(36)}`;
  const graphDir = path.join(GRAPHS_ROOT, id);

  await fs.promises.mkdir(graphDir, { recursive: true });
  await ensureGraphAssetDirectories(graphDir);
  seedStarterGraphAssets(graphDir);

  const now = Date.now();
  const graphType = params.type || 'song';

  const metadata: GraphPackageMetadata = {
    id,
    name,
    description: params.description || `Self-contained ${graphType} package`,
    type: graphType,
    customTypeTag: params.customTypeTag,
    version: '1.0.0',
    folderPath: `workspaces/default/graphs/${id}`,
    entryFile: 'graph.qms',
    createdAt: now,
    updatedAt: now,
    importedGraphIds: params.importedGraphIds || [],
    bpm: params.bpm || 120,
    masterVolume: params.masterVolume ?? 0.85,
    currentBiome: params.currentBiome || 'verdant_forest',
    nodeCount: params.nodes?.length || 0,
    assetCount: 0,
  };

  const graphPackage: GraphPackage = {
    format: 'qms_graph_package',
    version: '2.0.0',
    metadata,
    graph: {
      bpm: params.bpm || 120,
      masterVolume: params.masterVolume ?? 0.85,
      currentBiome: params.currentBiome || 'verdant_forest',
      nodes: params.nodes || [],
      connections: params.connections || [],
    },
  };

  await fs.promises.writeFile(
    path.join(graphDir, 'graph.qms'),
    JSON.stringify(graphPackage, null, 2),
    'utf-8'
  );

  return graphPackage;
}

/**
 * Save / Update an existing Graph Package
 */
export async function saveGraphPackage(
  id: string,
  payload: {
    name?: string;
    description?: string;
    type?: GraphType;
    customTypeTag?: string;
    bpm?: number;
    masterVolume?: number;
    currentBiome?: string;
    nodes?: SpaceNode[];
    connections?: NodeConnection[];
    mapIoConfig?: any;
    importedGraphIds?: string[];
  }
): Promise<GraphPackage> {
  ensureWorkspaceStructure();
  const safeId = path.basename(id);
  const graphDir = path.join(GRAPHS_ROOT, safeId);

  if (!fs.existsSync(graphDir)) {
    await fs.promises.mkdir(graphDir, { recursive: true });
    await ensureGraphAssetDirectories(graphDir);
  }

  const existing = await getGraphPackageById(safeId);
  const now = Date.now();

  const metadata: GraphPackageMetadata = {
    id: safeId,
    name: payload.name || existing?.metadata?.name || safeId,
    description: payload.description !== undefined ? payload.description : (existing?.metadata?.description || ''),
    type: payload.type || existing?.metadata?.type || 'custom',
    customTypeTag: payload.customTypeTag || existing?.metadata?.customTypeTag,
    version: existing?.metadata?.version || '1.0.0',
    folderPath: `workspaces/default/graphs/${safeId}`,
    entryFile: 'graph.qms',
    createdAt: existing?.metadata?.createdAt || now,
    updatedAt: now,
    importedGraphIds: payload.importedGraphIds || existing?.metadata?.importedGraphIds || [],
    bpm: payload.bpm ?? existing?.graph?.bpm ?? 120,
    masterVolume: payload.masterVolume ?? existing?.graph?.masterVolume ?? 0.85,
    currentBiome: payload.currentBiome ?? existing?.graph?.currentBiome ?? 'verdant_forest',
    nodeCount: payload.nodes?.length ?? existing?.graph?.nodes?.length ?? 0,
  };

  const graphPackage: GraphPackage = {
    format: 'qms_graph_package',
    version: '2.0.0',
    metadata,
    graph: {
      bpm: metadata.bpm,
      masterVolume: metadata.masterVolume ?? 0.85,
      currentBiome: metadata.currentBiome || 'verdant_forest',
      nodes: payload.nodes || existing?.graph?.nodes || [],
      connections: payload.connections || existing?.graph?.connections || [],
      mapIoConfig: payload.mapIoConfig || existing?.graph?.mapIoConfig,
    },
  };

  await fs.promises.writeFile(
    path.join(graphDir, 'graph.qms'),
    JSON.stringify(graphPackage, null, 2),
    'utf-8'
  );

  return graphPackage;
}

/**
 * Delete a Graph Package and its owned directory & assets
 */
export async function deleteGraphPackage(id: string): Promise<boolean> {
  const safeId = path.basename(id);
  const graphDir = path.join(GRAPHS_ROOT, safeId);

  if (!fs.existsSync(graphDir)) return false;
  await fs.promises.rm(graphDir, { recursive: true, force: true });
  return true;
}

/**
 * Import another Graph Package into target graph with DAG acyclic validation
 */
export async function importGraphDependency(
  targetGraphId: string,
  candidateImportId: string
): Promise<{ success: boolean; error?: string; metadata?: GraphPackageMetadata }> {
  const allPackages = await listAllGraphPackages();
  const graphMap: Record<string, { id: string; name: string; importedGraphIds: string[] }> = {};

  for (const pkg of allPackages) {
    graphMap[pkg.id] = {
      id: pkg.id,
      name: pkg.name,
      importedGraphIds: pkg.importedGraphIds || [],
    };
  }

  // Validate cycle
  const validation = validateGraphImport(graphMap, targetGraphId, candidateImportId);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Commit the import to target graph's metadata
  const targetPkg = await getGraphPackageById(targetGraphId);
  if (!targetPkg) {
    return { success: false, error: `Target graph '${targetGraphId}' not found.` };
  }

  const updatedImportIds = Array.from(
    new Set([...(targetPkg.metadata.importedGraphIds || []), candidateImportId])
  );

  const updatedPkg = await saveGraphPackage(targetGraphId, {
    importedGraphIds: updatedImportIds,
  });

  return { success: true, metadata: updatedPkg.metadata };
}

/**
 * Remove an imported Graph Package dependency
 */
export async function removeGraphDependency(
  targetGraphId: string,
  importIdToRemove: string
): Promise<{ success: boolean; metadata?: GraphPackageMetadata }> {
  const targetPkg = await getGraphPackageById(targetGraphId);
  if (!targetPkg) return { success: false };

  const updatedImportIds = (targetPkg.metadata.importedGraphIds || []).filter(
    (id) => id !== importIdToRemove
  );

  const updatedPkg = await saveGraphPackage(targetGraphId, {
    importedGraphIds: updatedImportIds,
  });

  return { success: true, metadata: updatedPkg.metadata };
}
