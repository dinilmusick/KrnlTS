/**
 * @file workspaceGraphService.ts
 * @description Universal workspace-scoped graph persistence service.
 *
 * This service owns graph documents and storage only. It does not know about
 * BRWLR, Playwright, ZX, node factories, or any application-specific node type.
 */

import { StorageAdapterFactory } from '../storage/StorageAdapterFactory.js';
import { findUserWorkspace } from '../core/workspaceCore.js';
import type {
  UniversalGraphNode,
  UniversalGraphEdge,
  UniversalNodeGraphDocument,
} from './nodeGraphPersistence/types.js';

export interface WorkspaceGraphDocument extends UniversalNodeGraphDocument {
  workspaceId: string;
  graphId: string;
  graphSlug: string;
}

export interface WorkspaceGraphSummary {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}

function slugify(name: string): string {
  const value = String(name || '').trim().replace(/[/\\]+/g, '_').replace(/[<>:"|?*]/g, '').slice(0, 80);
  return value || 'New Graph';
}

function storage() {
  return StorageAdapterFactory.create({
    provider: 'local_fs',
    basePath: process.env.KLOKS_GRAPH_STORAGE_ROOT || './workspaces-data',
  });
}

function graphPath(workspaceId: string, slug: string): string {
  return `workspaces/${workspaceId}/graphs/${slug}.graph.json`;
}

async function assertWorkspace(userId: string, workspaceId: string) {
  const result = await findUserWorkspace(workspaceId);
  if (!result.workspace || !result.user || result.user.id !== userId) {
    throw new Error(`Workspace ${workspaceId} does not exist`);
  }
  return result.workspace;
}

async function readGraph(workspaceId: string, slug: string): Promise<WorkspaceGraphDocument | null> {
  const adapter = storage();
  const path = graphPath(workspaceId, slug);
  if (!(await adapter.exists(path))) return null;
  const raw = new TextDecoder().decode(await adapter.read(path));
  return JSON.parse(raw) as WorkspaceGraphDocument;
}

async function writeGraph(document: WorkspaceGraphDocument): Promise<void> {
  const adapter = storage();
  await adapter.write(graphPath(document.workspaceId, document.graphSlug), JSON.stringify(document, null, 2), 'application/json');
}

function toDocument(
  workspaceId: string,
  id: string,
  name: string,
  slug: string,
  nodes: UniversalGraphNode[] = [],
  edges: UniversalGraphEdge[] = [],
  createdAt = new Date().toISOString(),
): WorkspaceGraphDocument {
  const now = new Date().toISOString();
  return {
    $schema: 'https://skipo.dev/schemas/node-graph.v1.json',
    version: '1.0.0',
    appId: workspaceId,
    appName: name,
    createdAt,
    updatedAt: now,
    exportedAt: now,
    workspaceId,
    graphId: id,
    graphSlug: slug,
    graph: { nodes, edges },
  };
}

export const workspaceGraphService = {
  async listGraphs(userId: string, workspaceId: string): Promise<{ success: true; graphs: WorkspaceGraphSummary[] }> {
    await assertWorkspace(userId, workspaceId);
    const adapter = storage();
    const files = await adapter.list(`workspaces/${workspaceId}/graphs`);
    const graphs: WorkspaceGraphSummary[] = [];
    for (const file of files.filter((item) => item.path.endsWith('.graph.json'))) {
      try {
        const raw = new TextDecoder().decode(await adapter.read(file.path));
        const graph = JSON.parse(raw) as WorkspaceGraphDocument;
        graphs.push({
          id: graph.graphId,
          name: graph.appName,
          slug: graph.graphSlug,
          createdAt: graph.createdAt,
          updatedAt: graph.updatedAt,
          nodeCount: graph.graph.nodes.length,
        });
      } catch {
        // Ignore malformed graph documents during listing.
      }
    }
    graphs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { success: true, graphs };
  },

  async createGraph(userId: string, workspaceId: string, input: { name?: string }) {
    await assertWorkspace(userId, workspaceId);
    const targetName = String(input?.name || '').trim().slice(0, 80) || 'New Graph';
    const baseSlug = slugify(targetName);
    let slug = baseSlug;
    let n = 2;
    while (await readGraph(workspaceId, slug)) slug = `${baseSlug} (${n++})`;
    const graph = toDocument(workspaceId, `graph-${Date.now()}`, targetName, slug);
    await writeGraph(graph);
    return { success: true as const, graph, graphs: (await this.listGraphs(userId, workspaceId)).graphs };
  },

  async getGraph(userId: string, workspaceId: string, slug: string) {
    await assertWorkspace(userId, workspaceId);
    const graph = await readGraph(workspaceId, slug);
    if (!graph) throw new Error(`Graph "${slug}" not found`);
    return { success: true as const, graph };
  },

  async saveGraph(
    userId: string,
    workspaceId: string,
    slug: string,
    patch: { nodes?: UniversalGraphNode[]; edges?: UniversalGraphEdge[]; name?: string },
  ) {
    await assertWorkspace(userId, workspaceId);
    const existing = await readGraph(workspaceId, slug);
    if (!existing) throw new Error(`Graph "${slug}" not found`);
    const next: WorkspaceGraphDocument = {
      ...existing,
      appName: typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim().slice(0, 80) : existing.appName,
      graph: {
        nodes: Array.isArray(patch.nodes) ? patch.nodes : existing.graph.nodes,
        edges: Array.isArray(patch.edges) ? patch.edges : existing.graph.edges,
      },
      updatedAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
    };
    await writeGraph(next);
    return { success: true as const, graph: next };
  },

  async deleteGraph(userId: string, workspaceId: string, slug: string) {
    await assertWorkspace(userId, workspaceId);
    const adapter = storage();
    const path = graphPath(workspaceId, slug);
    if (!(await adapter.exists(path))) throw new Error(`Graph "${slug}" not found`);
    await adapter.delete(path);
    return { success: true as const, deletedSlug: slug, graphs: (await this.listGraphs(userId, workspaceId)).graphs };
  },

  async duplicateGraph(userId: string, workspaceId: string, slug: string, newName?: string) {
    const existing = (await this.getGraph(userId, workspaceId, slug)).graph;
    const targetName = (newName || `${existing.appName} (Copy)`).trim().slice(0, 80);
    const baseSlug = slugify(targetName);
    let newSlug = baseSlug;
    let n = 2;
    while (await readGraph(workspaceId, newSlug)) newSlug = `${baseSlug} (${n++})`;
    const now = new Date().toISOString();
    const graph: WorkspaceGraphDocument = {
      ...JSON.parse(JSON.stringify(existing)),
      graphId: `graph-${Date.now()}`,
      graphSlug: newSlug,
      appName: targetName,
      createdAt: now,
      updatedAt: now,
      exportedAt: now,
    };
    await writeGraph(graph);
    return { success: true as const, graph, graphs: (await this.listGraphs(userId, workspaceId)).graphs };
  },

  async clearGraph(userId: string, workspaceId: string, slug: string) {
    const existing = (await this.getGraph(userId, workspaceId, slug)).graph;
    return this.saveGraph(userId, workspaceId, slug, { nodes: [], edges: [] });
  },

  async getGraphDocument(userId: string, workspaceId: string, slug: string) {
    return (await this.getGraph(userId, workspaceId, slug)).graph;
  },

  async saveGraphDocument(userId: string, workspaceId: string, document: WorkspaceGraphDocument) {
    await assertWorkspace(userId, workspaceId);
    if (document.workspaceId !== workspaceId) throw new Error('Graph workspace mismatch');
    await writeGraph({ ...document, updatedAt: new Date().toISOString(), exportedAt: new Date().toISOString() });
    return { success: true as const, graph: document };
  },
};
