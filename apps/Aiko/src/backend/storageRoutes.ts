/**
 * @file storageRoutes.ts
 * @description Thin Aiko adapter over the canonical Kloks workspace service.
 */

import { Router, Request } from 'express';
import { resolveAikoLuthUser, listAikoWorkspaces } from './adapters/luthFetchAuth.js';
import { getNodeWorkspaceService } from './storage/workspaceStorage.js';

export const storageRouter = Router();

function token(req: Request): string {
  const authorization = String(req.headers.authorization || req.headers['x-session-token'] || '').replace(/^Bearer\s+/i, '').trim();
  if (authorization) return authorization;
  const cookie = String(req.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith('luth_session='));
  return cookie ? decodeURIComponent(cookie.slice('luth_session='.length)) : '';
}

async function userId(req: Request): Promise<string | null> {
  const value = token(req);
  if (!value) return null;
  const user = await resolveAikoLuthUser(value, process.env);
  return user?.id || null;
}

async function activeWorkspace(req: Request): Promise<{ userId: string; workspaceId: string } | null> {
  const id = await userId(req);
  if (!id) return null;
  const result = await listAikoWorkspaces(id, { ...process.env, WORKSPACE_APP_ID: 'aiko' });
  const workspaceId = result.activeWorkspaceId || result.workspaces[0]?.id;
  return workspaceId ? { userId: id, workspaceId } : null;
}

storageRouter.get('/config', async (req, res) => {
  try {
    const active = await activeWorkspace(req);
    if (!active) return res.status(401).json({ success: false, error: 'Unauthenticated session or no active workspace.' });
    return res.json({
      success: true,
      config: {
        primary: { id: active.workspaceId, provider: 'canonical_workspace', label: 'Kloks Workspace', status: 'CONNECTED' },
        backups: [],
        sync: { state: 'CANONICAL', workspaceId: active.workspaceId },
      },
    });
  } catch (error) {
    return res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Workspace service unavailable.' });
  }
});

storageRouter.post('/sync', async (req, res) => {
  try {
    const active = await activeWorkspace(req);
    if (!active) return res.status(401).json({ success: false, error: 'Unauthenticated session or no active workspace.' });
    return res.json({ success: true, sync: { state: 'CANONICAL', workspaceId: active.workspaceId }, syncedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Workspace service unavailable.' });
  }
});

storageRouter.get('/files', async (req, res) => {
  try {
    const active = await activeWorkspace(req);
    if (!active) return res.status(401).json({ success: false, error: 'Unauthenticated session or no active workspace.' });
    const service = await getNodeWorkspaceService();
    if (!service) return res.status(503).json({ success: false, error: 'Workspace service unavailable.' });
    const files = await service.listFiles(active.workspaceId, String(req.query.dir || ''));
    return res.json({ success: true, files });
  } catch (error) {
    return res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Workspace service unavailable.' });
  }
});

storageRouter.get('/files/*', async (req, res) => {
  try {
    const active = await activeWorkspace(req);
    if (!active) return res.status(401).json({ success: false, error: 'Unauthenticated session or no active workspace.' });
    const filePath = String(req.params[0] || '');
    const service = await getNodeWorkspaceService();
    if (!service) return res.status(503).json({ success: false, error: 'Workspace service unavailable.' });
    const data = await service.readFile(active.workspaceId, filePath);
    return res.type('application/octet-stream').send(data);
  } catch (error) {
    return res.status(404).json({ success: false, error: error instanceof Error ? error.message : 'File not found.' });
  }
});

storageRouter.put('/files/*', async (req, res) => {
  try {
    const active = await activeWorkspace(req);
    if (!active) return res.status(401).json({ success: false, error: 'Unauthenticated session or no active workspace.' });
    const filePath = String(req.params[0] || '');
    const service = await getNodeWorkspaceService();
    if (!service) return res.status(503).json({ success: false, error: 'Workspace service unavailable.' });
    const result = await service.writeFile(active.workspaceId, filePath, typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    return res.json(result);
  } catch (error) {
    return res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Workspace service unavailable.' });
  }
});

storageRouter.delete('/files/*', async (req, res) => {
  try {
    const active = await activeWorkspace(req);
    if (!active) return res.status(401).json({ success: false, error: 'Unauthenticated session or no active workspace.' });
    const filePath = String(req.params[0] || '');
    const service = await getNodeWorkspaceService();
    if (!service) return res.status(503).json({ success: false, error: 'Workspace service unavailable.' });
    return res.json(await service.deleteFile(active.workspaceId, filePath));
  } catch (error) {
    return res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Workspace service unavailable.' });
  }
});

export default storageRouter;
