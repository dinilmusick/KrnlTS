/**
 * ASCII Architecture Flowchart: memoryRoutes
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize memoryRoutes      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │    Workspace Memories CRUD       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Tool & Feature Learnings CRUD   │
 *   └──────────────────────────────────┘
 */

import { Router, Request, Response } from 'express';
import { workspaceFS } from '../storage/workspaceFileSystem.js';
import { WorkspaceRepository } from '../storage/workspaceRepository.js';
import { MemoryStore } from '../storage/memoryStore.js';
import { LearningStore } from '../storage/learningStore.js';

export const memoryRouter = Router();

const repo = new WorkspaceRepository(workspaceFS);
const memoryStore = new MemoryStore(workspaceFS);
const learningStore = new LearningStore(repo);

function resolveWs(req: Request): string {
  const ws = req.params.workspaceId || req.params.workspace || (req.query.workspace as string)
    || (req.headers['x-workspace-id'] as string) || req.body?.workspaceId || req.body?.workspace;
  if (typeof ws !== 'string' || !ws.trim()) {
    throw Object.assign(new Error('An explicit workspace ID is required.'), { status: 400 });
  }
  return ws.trim();
}

function resolveFeat(req: Request): string {
  return req.params.featureName || req.params.endpointName || '';
}

// ════ MEMORY ROUTES ════════════════════════════════════════════════════════════════
memoryRouter.get('/workspaces/:workspaceId/memories', async (req, res) => {
  try {
    res.json({ success: true, memories: await memoryStore.list(resolveWs(req)) });
  } catch (err: any) {
    res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
  }
});

memoryRouter.get('/workspaces/:workspaceId/memories/:name', async (req, res) => {
  try {
    const memory = await memoryStore.get(resolveWs(req), req.params.name);
    if (!memory) return res.status(404).json({ success: false, error: 'Memory not found' });
    res.json({ success: true, memory });
  } catch (err: any) {
    res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
  }
});

memoryRouter.post('/workspaces/:workspaceId/memories', async (req, res) => {
  try {
    const { name, content, entries, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Memory name required' });
    if (content) {
      const entry = await memoryStore.addEntry(resolveWs(req), name, { content });
      return res.json({ success: true, entry });
    }
    const memory = { schemaVersion: '1.0.0', name, description, entries: entries || [] };
    await memoryStore.save(resolveWs(req), memory);
    res.json({ success: true, memory });
  } catch (err: any) {
    res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
  }
});

memoryRouter.delete('/workspaces/:workspaceId/memories/:name', async (req, res) => {
  try {
    await memoryStore.delete(resolveWs(req), req.params.name);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
  }
});

// ════ TOOL LEARNINGS ROUTES & ALIASES ══════════════════════════════════════════════
const toolPrefixes = ['/workspaces/:workspaceId/tools/:toolName', '/workspaces/:workspace/tools/:toolName', '/tools/:toolName'];

for (const tp of toolPrefixes) {
  memoryRouter.get(`${tp}/learnings`, async (req, res) => {
    try {
      const p = req.params as Record<string, string>;
      res.json({ success: true, learnings: await learningStore.getToolLearnings(resolveWs(req), p.toolName) });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
    }
  });

  memoryRouter.post(`${tp}/learnings`, async (req, res) => {
    try {
      const p = req.params as Record<string, string>;
      const { content, id } = req.body;
      if (!content) return res.status(400).json({ success: false, error: 'Content is required' });
      res.json({ success: true, learning: await learningStore.addToolLearning(resolveWs(req), p.toolName, { id, content }) });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
    }
  });

  memoryRouter.put(`${tp}/learnings/:id`, async (req, res) => {
    try {
      const p = req.params as Record<string, string>;
      const { content } = req.body;
      if (!content) return res.status(400).json({ success: false, error: 'Content is required' });
      await learningStore.updateToolLearning(resolveWs(req), p.toolName, p.id, content);
      res.json({ success: true, message: `Learning '${p.id}' updated.` });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
    }
  });

  memoryRouter.delete(`${tp}/learnings/:id`, async (req, res) => {
    try {
      const p = req.params as Record<string, string>;
      await learningStore.deleteToolLearning(resolveWs(req), p.toolName, p.id);
      res.json({ success: true, message: `Learning '${p.id}' deleted.` });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
    }
  });
}

// ════ FEATURE & ENDPOINT LEARNINGS ROUTES & ALIASES ════════════════════════════════
const featPrefixes = [
  '/workspaces/:workspaceId/tools/:toolName/features/:featureName',
  '/workspaces/:workspaceId/tools/:toolName/endpoints/:endpointName',
  '/workspaces/:workspace/tools/:toolName/features/:featureName',
  '/workspaces/:workspace/tools/:toolName/endpoints/:endpointName',
  '/tools/:toolName/features/:featureName',
  '/tools/:toolName/endpoints/:endpointName'
];

for (const fp of featPrefixes) {
  memoryRouter.get(`${fp}/learnings`, async (req, res) => {
    try {
      const p = req.params as Record<string, string>;
      res.json({ success: true, learnings: await learningStore.getFeatureLearnings(resolveWs(req), p.toolName, resolveFeat(req)) });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
    }
  });

  memoryRouter.post(`${fp}/learnings`, async (req, res) => {
    try {
      const p = req.params as Record<string, string>;
      const { content, id } = req.body;
      if (!content) return res.status(400).json({ success: false, error: 'Content is required' });
      res.json({ success: true, learning: await learningStore.addFeatureLearning(resolveWs(req), p.toolName, resolveFeat(req), { id, content }) });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
    }
  });

  memoryRouter.put(`${fp}/learnings/:id`, async (req, res) => {
    try {
      const p = req.params as Record<string, string>;
      const { content } = req.body;
      if (!content) return res.status(400).json({ success: false, error: 'Content is required' });
      await learningStore.updateFeatureLearning(resolveWs(req), p.toolName, resolveFeat(req), p.id, content);
      res.json({ success: true, message: `Learning '${p.id}' updated.` });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
    }
  });

  memoryRouter.delete(`${fp}/learnings/:id`, async (req, res) => {
    try {
      const p = req.params as Record<string, string>;
      await learningStore.deleteFeatureLearning(resolveWs(req), p.toolName, resolveFeat(req), p.id);
      res.json({ success: true, message: `Learning '${p.id}' deleted.` });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, error: err.message || String(err) });
    }
  });
}