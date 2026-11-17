import fs from 'fs';
import path from 'path';
import { DawProject, SpaceNode, NodeConnection } from '@kloks/state-graph';
import { getWorkingWorkspaceDir } from '../../core/workspaceSyncEngine.js';

export interface WorkspaceFolderResolution {
  wsDir: string;
  wsName: string;
  wsFolder: string;
  wsId: string;
}

const AUTH_FILE_PATH = path.resolve('.skipo/accounts.json');

export async function resolveWorkspaceDir(workspaceIdOrSlug?: string): Promise<WorkspaceFolderResolution> {
  const workingDir = getWorkingWorkspaceDir();
  let targetWs: any = null;

  try {
    if (fs.existsSync(AUTH_FILE_PATH)) {
      const raw = await fs.promises.readFile(AUTH_FILE_PATH, 'utf-8');
      const accounts = JSON.parse(raw);
      for (const user of Object.values<any>(accounts)) {
        if (Array.isArray(user.workspaces)) {
          const found = user.workspaces.find(
            (w: any) =>
              w.id === workspaceIdOrSlug ||
              w.name?.toLowerCase() === workspaceIdOrSlug?.toLowerCase() ||
              w.localFolderName?.toLowerCase() === workspaceIdOrSlug?.toLowerCase()
          );
          if (found) {
            targetWs = found;
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error reading accounts for workspace resolution:', err);
  }

  if (targetWs) {
    const rawFolderName = targetWs.localFolderName || targetWs.name.replace(/[/\\?%*:|"<>]/g, '_');
    const folderName = rawFolderName.trim();
    // Working workspace is flatly the working directory
    await fs.promises.mkdir(workingDir, { recursive: true });
    return { wsDir: workingDir, wsName: targetWs.name, wsFolder: folderName, wsId: targetWs.id };
  }

  await fs.promises.mkdir(workingDir, { recursive: true });
  return { wsDir: workingDir, wsName: 'Active Workspace', wsFolder: 'workspace', wsId: workspaceIdOrSlug || 'default' };
}

export async function listWorkspaceGraphs(workspaceIdOrSlug?: string): Promise<DawProject[]> {
  const { wsDir, wsFolder } = await resolveWorkspaceDir(workspaceIdOrSlug);
  const graphs: DawProject[] = [];

  const inspectDirForGraph = async (dirPath: string, folderName: string): Promise<DawProject | null> => {
    const projectJson = path.join(dirPath, 'project.json');
    const graphQms = path.join(dirPath, 'graph.qms');
    let data: any = null;

    if (fs.existsSync(projectJson)) {
      try {
        const raw = await fs.promises.readFile(projectJson, 'utf-8');
        data = JSON.parse(raw);
      } catch {}
    } else if (fs.existsSync(graphQms)) {
      try {
        const raw = await fs.promises.readFile(graphQms, 'utf-8');
        const pkg = JSON.parse(raw);
        data = { ...(pkg.metadata || {}), ...(pkg.graph || {}) };
      } catch {}
    }

    if (!data) return null;

    const stat = await fs.promises.stat(dirPath);
    const nodeCount = Array.isArray(data.nodes) ? data.nodes.length : 0;
    const connectionCount = Array.isArray(data.connections) ? data.connections.length : 0;

    return {
      id: data.id || folderName,
      name: data.name || folderName,
      description: data.description || '',
      folderName,
      folderPath: path.relative(process.cwd(), dirPath).replace(/\\/g, '/'),
      createdAt: data.createdAt || stat.birthtimeMs,
      updatedAt: data.updatedAt || stat.mtimeMs,
      bpm: data.bpm || 120,
      masterVolume: data.masterVolume ?? 0.85,
      currentBiome: data.currentBiome || 'verdant_forest',
      nodes: data.nodes || [],
      connections: data.connections || [],
      mapIoConfig: data.mapIoConfig,
      nodeCount,
      connectionCount,
    } as any;
  };

  const entries = await fs.promises.readdir(wsDir);
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'samples' || entry === 'assets') continue;
    const fullPath = path.join(wsDir, entry);
    const stat = await fs.promises.stat(fullPath);
    if (!stat.isDirectory()) continue;

    if (entry === 'graphs') {
      const subEntries = await fs.promises.readdir(fullPath);
      for (const sub of subEntries) {
        if (sub.startsWith('.')) continue;
        const subPath = path.join(fullPath, sub);
        const subStat = await fs.promises.stat(subPath);
        if (subStat.isDirectory()) {
          const g = await inspectDirForGraph(subPath, sub);
          if (g) graphs.push(g);
        }
      }
      continue;
    }

    const g = await inspectDirForGraph(fullPath, entry);
    if (g) graphs.push(g);
  }

  return graphs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function createWorkspaceGraph(
  workspaceIdOrSlug: string,
  params: {
    name: string;
    description?: string;
    bpm?: number;
    masterVolume?: number;
    currentBiome?: string;
    templateData?: { nodes?: SpaceNode[]; connections?: NodeConnection[]; bpm?: number; masterVolume?: number; currentBiome?: string };
  }
): Promise<DawProject> {
  const { wsDir, wsFolder, wsId } = await resolveWorkspaceDir(workspaceIdOrSlug);
  const rawName = params.name.trim();
  const folderName = rawName.replace(/[/\\?%*:|"<>]/g, '_');
  const graphDir = path.join(wsDir, folderName);

  await fs.promises.mkdir(graphDir, { recursive: true });
  await fs.promises.mkdir(path.join(graphDir, 'samples'), { recursive: true });
  await fs.promises.mkdir(path.join(graphDir, 'assets'), { recursive: true });

  const now = Date.now();
  const nodes = params.templateData?.nodes || [];
  const connections = params.templateData?.connections || [];
  const bpm = params.templateData?.bpm || params.bpm || 120;
  const masterVolume = params.templateData?.masterVolume ?? params.masterVolume ?? 0.85;
  const currentBiome = params.templateData?.currentBiome || params.currentBiome || 'verdant_forest';

  const projectData: DawProject = {
    id: folderName,
    name: rawName,
    description: params.description || `Workspace graph in ${wsFolder}`,
    folderPath: path.relative(process.cwd(), graphDir).replace(/\\/g, '/'),
    createdAt: now,
    updatedAt: now,
    bpm,
    masterVolume,
    currentBiome,
    nodes,
    connections,
  };

  await fs.promises.writeFile(path.join(graphDir, 'project.json'), JSON.stringify(projectData, null, 2), 'utf-8');

  const graphPackage = {
    format: 'qms_graph_package',
    version: '2.0.0',
    metadata: {
      id: folderName,
      name: rawName,
      description: projectData.description,
      folderPath: projectData.folderPath,
      createdAt: now,
      updatedAt: now,
      nodeCount: nodes.length,
      bpm,
      masterVolume,
      currentBiome,
    },
    graph: { bpm, masterVolume, currentBiome, nodes, connections },
  };
  await fs.promises.writeFile(path.join(graphDir, 'graph.qms'), JSON.stringify(graphPackage, null, 2), 'utf-8');

  return projectData;
}

export async function getWorkspaceGraph(workspaceIdOrSlug: string, graphIdOrName: string): Promise<DawProject | null> {
  const { wsDir } = await resolveWorkspaceDir(workspaceIdOrSlug);
  const safeTarget = graphIdOrName.replace(/[/\\?%*:|"<>]/g, '_');
  const candidates = [
    path.join(wsDir, safeTarget),
    path.join(wsDir, graphIdOrName),
    path.join(wsDir, 'graphs', safeTarget),
  ];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      const pJson = path.join(cand, 'project.json');
      if (fs.existsSync(pJson)) {
        const raw = await fs.promises.readFile(pJson, 'utf-8');
        return JSON.parse(raw);
      }
      const gQms = path.join(cand, 'graph.qms');
      if (fs.existsSync(gQms)) {
        const raw = await fs.promises.readFile(gQms, 'utf-8');
        const pkg = JSON.parse(raw);
        return { ...(pkg.metadata || {}), ...(pkg.graph || {}) };
      }
    }
  }
  return null;
}

export async function saveWorkspaceGraph(
  workspaceIdOrSlug: string,
  graphIdOrName: string,
  payload: Record<string, any>
): Promise<DawProject> {
  const { wsDir } = await resolveWorkspaceDir(workspaceIdOrSlug);
  const safeTarget = graphIdOrName.replace(/[/\\?%*:|"<>]/g, '_');
  let targetDir = path.join(wsDir, safeTarget);

  if (!fs.existsSync(targetDir) && fs.existsSync(path.join(wsDir, 'graphs', safeTarget))) {
    targetDir = path.join(wsDir, 'graphs', safeTarget);
  }

  await fs.promises.mkdir(targetDir, { recursive: true });
  const pJson = path.join(targetDir, 'project.json');
  let existing: any = {};
  if (fs.existsSync(pJson)) {
    try {
      existing = JSON.parse(await fs.promises.readFile(pJson, 'utf-8'));
    } catch {}
  }

  const updated: DawProject = {
    ...existing,
    ...payload,
    id: existing.id || path.basename(targetDir),
    updatedAt: Date.now(),
  };

  await fs.promises.writeFile(pJson, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export async function deleteWorkspaceGraph(workspaceIdOrSlug: string, graphIdOrName: string): Promise<boolean> {
  const { wsDir } = await resolveWorkspaceDir(workspaceIdOrSlug);
  const safeTarget = graphIdOrName.replace(/[/\\?%*:|"<>]/g, '_');
  const candidates = [
    path.join(wsDir, safeTarget),
    path.join(wsDir, graphIdOrName),
    path.join(wsDir, 'graphs', safeTarget),
  ];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      await fs.promises.rm(cand, { recursive: true, force: true });
      return true;
    }
  }
  return false;
}
