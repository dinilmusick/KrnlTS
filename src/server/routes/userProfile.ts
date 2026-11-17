/**
 * @file userProfile.ts
 * @description User Profile, Service Persistence, and User Database Router.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import { query } from '../db';
import { addAuditLog } from '../audit';
import { getWorkspaceVault, flushWorkspaceVault } from '../storage/workspaceVaultCoordinator';
import { appendServiceLog } from '../storage/workspaceLogService';
import { getVerifiedPrincipal } from '../luthSession';
import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';

const router = express.Router();

function getUserId(req: Request): string {
  return getVerifiedPrincipal(req)?.id || '';
}

async function getUserRecord(userId: string): Promise<any | null> {
  try {
    const res = await query('SELECT id, email, username, name, role, app_profiles, created_at, updated_at FROM "srkl_application_profiles" WHERE id = $1', [userId]);
    if (res.rows.length > 0) return res.rows[0];
  } catch {}
  return null;
}

async function saveUserAppProfiles(userId: string, appProfiles: any): Promise<void> {
  const serialized = JSON.stringify(appProfiles);
  try {
    const q = 'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2';
    await query(q, [serialized, userId]);
  } catch (err: any) {
    console.warn('[UserProfile] Save profiles error:', err.message);
  }
}

// GET /api/user/profile
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const user = await getUserRecord(userId);
  if (!user) {
    res.json({ success: true, profile: { workspaceName: 'SRKL Service Hub', workspaces: [], storage_connections: [] }, user: { id: userId, role: 'user' } });
    return;
  }
  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const storedProfile = appProfiles.srkl || {};
  // Generic profile reads never return ciphertext envelopes or legacy
  // plaintext storage credentials. Use the dedicated public Kloks projection.
  const { storage_connections: _storedConnections, ...profile } = storedProfile;
  const connections = await StorageServiceFacade.execute('getConnections', {
    userId,
    env: process.env as Record<string, unknown>,
  }) as Array<Record<string, any>>;
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    success: true,
    profile: {
      ...profile,
      storage_connections: connections,
    },
    user: { id: user.id, email: user.email, name: user.name, role: user.role === 'admin' ? 'admin' : 'user' },
  });
});

// PUT /api/user/profile
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const user = await getUserRecord(userId);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  appProfiles.srkl = { ...(appProfiles.srkl || {}), ...(req.body.profile || req.body), lastActiveAt: new Date().toISOString() };
  await saveUserAppProfiles(userId, appProfiles);
  res.json({ success: true, profile: appProfiles.srkl });
});

// GET /api/user/services
router.get('/services', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query?.workspaceId as string) || undefined;
  try {
    const { manager } = await getWorkspaceVault(userId, workspaceId);

    const services = manager.getServiceAccounts();
    const customDefs = manager.getCustomDefinitions();
    res.json({ services, customDefinitions: customDefs, groups: manager.getGroups(), tabs: manager.getTabs() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/services
router.post('/services', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body?.workspaceId as string) || undefined;
  const { serviceAccount } = req.body;
  if (!serviceAccount?.id) { res.status(400).json({ error: 'Invalid service account data' }); return; }

  try {
    const { manager, conn, folderPrefix } = await getWorkspaceVault(userId, workspaceId);
    manager.upsertServiceAccount(serviceAccount);
    await flushWorkspaceVault(userId, workspaceId);

    await appendServiceLog(conn, folderPrefix, {
      serviceId: serviceAccount.serviceId,
      action: 'SERVICE_SAVED',
      status: 'ok',
      accountId: serviceAccount.id,
      details: `Saved account ${serviceAccount.name || serviceAccount.serviceId}`,
    });

    await addAuditLog('SERVICE_CREDENTIALS_SAVED', userId, `Saved credentials for ${serviceAccount.serviceId} in encrypted vault`, 'vault');
    res.json({ success: true, services: manager.getServiceAccounts() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/definitions
router.post('/definitions', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body?.workspaceId as string) || undefined;
  const { definition } = req.body;
  if (!definition?.identifier) { res.status(400).json({ error: 'Invalid service definition data' }); return; }
  try {
    const { manager } = await getWorkspaceVault(userId, workspaceId);
    manager.upsertCustomDefinition(definition);
    await flushWorkspaceVault(userId, workspaceId);
    res.json({ success: true, customDefinitions: manager.getCustomDefinitions() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/user/services/:id
router.delete('/services/:id', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query?.workspaceId as string) || undefined;
  try {
    const { manager, conn, folderPrefix } = await getWorkspaceVault(userId, workspaceId);
    manager.deleteServiceAccount(req.params.id);
    await flushWorkspaceVault(userId, workspaceId);

    await appendServiceLog(conn, folderPrefix, {
      serviceId: req.params.id,
      action: 'SERVICE_REMOVED',
      status: 'ok',
      details: `Removed account ${req.params.id}`,
    });

    await addAuditLog('SERVICE_REMOVED', userId, `Removed service ${req.params.id} from vault`, 'vault');
    res.json({ success: true, services: manager.getServiceAccounts() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/groups
router.post('/groups', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body?.workspaceId as string) || undefined;
  const { group } = req.body;
  if (!group?.id) { res.status(400).json({ error: 'Invalid group data' }); return; }
  try {
    const { manager } = await getWorkspaceVault(userId, workspaceId);
    manager.upsertGroup(group);
    await flushWorkspaceVault(userId, workspaceId);
    res.json({ success: true, groups: manager.getGroups() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/user/groups/:id
router.delete('/groups/:id', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query?.workspaceId as string) || undefined;
  try {
    const { manager } = await getWorkspaceVault(userId, workspaceId);
    manager.deleteGroup(req.params.id);
    await flushWorkspaceVault(userId, workspaceId);
    res.json({ success: true, groups: manager.getGroups() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/user/tabs
router.post('/tabs', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.body?.workspaceId as string) || undefined;
  const { tab } = req.body;
  if (!tab?.id) { res.status(400).json({ error: 'Invalid tab data' }); return; }
  try {
    const { manager } = await getWorkspaceVault(userId, workspaceId);
    manager.upsertTab(tab);
    await flushWorkspaceVault(userId, workspaceId);
    res.json({ success: true, tabs: manager.getTabs() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/user/tabs/:id
router.delete('/tabs/:id', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query?.workspaceId as string) || undefined;
  try {
    const { manager } = await getWorkspaceVault(userId, workspaceId);
    manager.deleteTab(req.params.id);
    await flushWorkspaceVault(userId, workspaceId);
    res.json({ success: true, tabs: manager.getTabs() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
