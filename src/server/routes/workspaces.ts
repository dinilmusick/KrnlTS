/**
 * @file workspaces.ts
 * @description Workspace Management & Storage Routing for SRKL.
 * Handles workspace CRUD, cloud storage setup (Backblaze B2/S3/Local),
 * clone sync, and service-level activity logs.
 * File size strictly < 200 lines.
 */

import express, { Request, Response } from 'express';
import { query } from '../db';
import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { getVerifiedPrincipal } from '../luthSession';
import { addAuditLog } from '../audit';
import { initializeCloudWorkspaceBucket, testStorageConnection } from '../storage/cloudStorageService';
import { formatCanonicalWorkspaceFolderName, extractCanonicalFolderPrefix } from '../storage/workspaceCanonical';
import { getWorkspaceVault, flushWorkspaceVault, clearVaultCache } from '../storage/workspaceVaultCoordinator';
import { appendServiceLog, getServiceLogs } from '../storage/workspaceLogService';
import { UserStorageConnection, SrklWorkspace } from '@/libraries/types/auth';
import {
  getStorageConnections,
  saveStorageConnection,
  deleteStorageConnection,
  syncStorageClones,
  sanitizeStorageConnection,
  sanitizeStorageConnections,
} from '../storage/workspaceStorageController';
import {
  exportWorkspaceData,
  applyImportedWorkspaceData,
  deleteWorkspaceRecord,
  updateWorkspaceRecord,
} from '../storage/workspaceBackupController';

const router = express.Router();

function getUserId(req: Request): string {
  return getVerifiedPrincipal(req)?.id || '';
}

// GET /api/workspaces
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  try {
    const userRes = await query('SELECT * FROM "srkl_application_profiles" WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) { res.json({ workspaces: [], storage_connections: [] }); return; }
    const user = userRes.rows[0];
    const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : user.app_profiles || {};
    const srkl = appProfiles.srkl || {};
    const conns = await getStorageConnections(userId);
    const existingWorkspaces: SrklWorkspace[] = Array.isArray(srkl.workspaces) ? srkl.workspaces : [];

    // Keep an empty profile empty until the user selects persistent storage in the
    // canonical Floks WorkspaceCreateDialog. Never silently provision a local vault.
    if (existingWorkspaces.length === 0) {
      res.json({
        workspaces: [],
        activeWorkspaceId: null,
        storage_connections: sanitizeStorageConnections(conns),
      });
      return;
    }

    // Preserve every legacy workspace association. Normalize only a stale active
    // pointer; never collapse the stored workspace array during a read.
    const activeWorkspace = existingWorkspaces.find((workspace) => workspace.id === srkl.activeWorkspaceId)
      || existingWorkspaces[0];
    if (srkl.activeWorkspaceId !== activeWorkspace.id) {
      appProfiles.srkl = { ...srkl, activeWorkspaceId: activeWorkspace.id };
      await query('UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(appProfiles), userId]);
    }

    res.json({
      workspaces: existingWorkspaces,
      activeWorkspaceId: activeWorkspace.id,
      storage_connections: sanitizeStorageConnections(conns),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { name, importData } = req.body;
  const requestedStorage = req.body.storage || {};
  const storageConnectionId = req.body.storageConnectionId || requestedStorage.connectionId;
  const storageProvider = String(req.body.storageProvider || requestedStorage.provider || '');
  const requestedGoogleRootFolderId = req.body.googleRootFolderId || requestedStorage.googleRootFolderId;
  const requestedB2BucketName = String(req.body.b2BucketName || requestedStorage.b2BucketName || requestedStorage.bucketName || '').trim();
  if (!name?.trim()) { res.status(400).json({ error: 'Workspace name is required' }); return; }
  if (!['google_drive', 'backblaze_b2'].includes(storageProvider)) {
    res.status(400).json({ error: 'SRKL workspace vaults require Google Drive or Backblaze B2 persistent storage.' });
    return;
  }
  if (!storageConnectionId) {
    res.status(400).json({ error: 'Select an authorized external storage connection before creating a workspace vault.' });
    return;
  }
  if (storageProvider === 'backblaze_b2' && !requestedB2BucketName) {
    res.status(400).json({ error: 'Select a Backblaze B2 bucket before creating the workspace vault.' });
    return;
  }

  try {
    const userRes = await query('SELECT * FROM "srkl_application_profiles" WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
    const user = userRes.rows[0];
    const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : user.app_profiles || {};
    if (!appProfiles.srkl) appProfiles.srkl = {};

    const existingWorkspaces: SrklWorkspace[] = Array.isArray(appProfiles.srkl.workspaces) ? appProfiles.srkl.workspaces : [];
    if (existingWorkspaces.length > 0) {
      const existing = existingWorkspaces.find((workspace) => workspace.id === appProfiles.srkl.activeWorkspaceId)
        || existingWorkspaces[0];
      // Keep legacy workspace records and associations intact. This API does
      // not silently migrate or delete additional workspace records.
      res.status(409).json({
        success: false,
        error: 'An SRKL workspace already exists for this user.',
        workspace: existing,
        workspaces: existingWorkspaces,
      });
      return;
    }
    if (!appProfiles.srkl) appProfiles.srkl = {};

    const connections = await getStorageConnections(userId);
    const selectedConnection = connections.find((connection) => connection.id === storageConnectionId);
    if (!selectedConnection) {
      res.status(400).json({ error: 'Select a connected persistent storage connection before creating a workspace vault.' });
      return;
    }
    if (selectedConnection.provider !== storageProvider) {
      res.status(400).json({ error: 'Selected storage connection does not match the requested workspace provider.' });
      return;
    }
    if (storageProvider === 'backblaze_b2') {
      const buckets = await StorageServiceFacade.execute('listBackblazeConnectionBuckets', {
        userId,
        connectionId: selectedConnection.id,
        env: process.env as Record<string, unknown>,
      }) as Array<{ name?: string; bucketName?: string }>;
      const bucketExists = (Array.isArray(buckets) ? buckets : []).some((bucket) =>
        String(bucket.bucketName || bucket.name || '').trim() === requestedB2BucketName,
      );
      if (!bucketExists) {
        res.status(400).json({ error: 'The selected Backblaze bucket is not available to this account.' });
        return;
      }
    }
    let googleRootFolder: { id: string; name: string } | undefined;
    if (storageProvider === 'google_drive') {
      if (!selectedConnection || !requestedGoogleRootFolderId) {
        res.status(400).json({ error: 'Connect Google Drive and select a Drive folder before creating the workspace.' });
        return;
      }
      const resolved = await StorageServiceFacade.execute('selectGoogleDriveRootFolder', {
        userId,
        connectionId: selectedConnection.id,
        folderId: String(requestedGoogleRootFolderId),
        env: process.env as Record<string, unknown>,
      }) as { id: string; name: string };
      googleRootFolder = { id: resolved.id, name: resolved.name };
    }

    const wsId = `ws-srkl-${Date.now()}`;
    const userName = user.username || user.name || 'user';
    const canonicalFolder = formatCanonicalWorkspaceFolderName('srkl', userName, name.trim());
    const newWs: SrklWorkspace = {
      id: wsId,
      name: name.trim(),
      workspacePath: `./${canonicalFolder}`,
      storageProvider,
      storageConnectionId: selectedConnection.id,
      ...(storageProvider === 'backblaze_b2' ? { b2BucketName: requestedB2BucketName } : {}),
      ...(googleRootFolder ? { googleRootFolderId: googleRootFolder.id, googleRootFolderName: googleRootFolder.name } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const workspaces: SrklWorkspace[] = appProfiles.srkl.workspaces || [];
    workspaces.push(newWs);
    appProfiles.srkl.workspaces = workspaces;
    appProfiles.srkl.activeWorkspaceId = wsId;

    await query('UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(appProfiles), userId]);
    await clearVaultCache(userId);

    let importSummary: any = null;
    try {
      const { manager, folderPrefix, conn } = await getWorkspaceVault(userId, wsId);
      if (importData && (Array.isArray(importData.serviceAccounts) || Array.isArray(importData.customDefinitions))) {
        importSummary = await applyImportedWorkspaceData(userId, wsId, importData);
      } else {
        await flushWorkspaceVault(userId, wsId);
      }

      if (conn && conn.provider !== 'local_fs') {
        const secret = (await import('../storage/cryptoVault')).getDefaultWorkspaceSecret(userId, wsId);
        const encDb = (await import('../storage/cryptoVault')).encryptVaultBuffer(manager.exportBinary(), secret);
        await initializeCloudWorkspaceBucket(conn, folderPrefix, name.trim(), encDb);
      }
    } catch (vaultErr: any) {
      // ATOMIC ROLLBACK: Remove inserted workspace from PostgreSQL so corrupted/ghost records never persist
      appProfiles.srkl.workspaces = (appProfiles.srkl.workspaces || []).filter((w: any) => w.id !== wsId);
      appProfiles.srkl.activeWorkspaceId = appProfiles.srkl.workspaces[0]?.id || '';
      await query('UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(appProfiles), userId]);
      await clearVaultCache(userId, wsId);
      throw new Error(`Failed to initialize workspace in storage: ${vaultErr.message}`);
    }

    await addAuditLog('WORKSPACE_CREATED', userId, `Created workspace ${name.trim()} (${canonicalFolder})`, 'workspace');
    res.json({ success: true, workspace: newWs, importSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/workspaces/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  try {
    const result = await deleteWorkspaceRecord(userId, req.params.id);
    if (!result) { res.status(404).json({ error: 'Workspace not found' }); return; }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/:id/export
router.get('/:id/export', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  try {
    const bundle = await exportWorkspaceData(userId, req.params.id);
    if (!bundle) { res.status(404).json({ error: 'Workspace not found' }); return; }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="srkl-workspace-${bundle.workspace.name}.json"`);
    res.json(bundle);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workspaces (action: 'switch' | 'update')
router.put('/', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { action, workspaceId, name, storageConnectionId, storageProvider } = req.body;
  if (!workspaceId) { res.status(400).json({ error: 'Workspace ID required' }); return; }

  try {
    if (action === 'update') {
      const updated = await updateWorkspaceRecord(userId, workspaceId, { name, storageConnectionId, storageProvider });
      if (!updated) { res.status(404).json({ error: 'Workspace not found' }); return; }
      res.json(updated);
      return;
    }

    const userRes = await query('SELECT * FROM "srkl_application_profiles" WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
    const user = userRes.rows[0];
    const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : user.app_profiles || {};
    if (!appProfiles.srkl) appProfiles.srkl = {};

    const workspaces: SrklWorkspace[] = Array.isArray(appProfiles.srkl.workspaces) ? appProfiles.srkl.workspaces : [];
    const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);
    if (!selectedWorkspace) { res.status(404).json({ error: 'Workspace not found' }); return; }

    if (action === 'switch') {
      appProfiles.srkl.activeWorkspaceId = selectedWorkspace.id;
      await query('UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(appProfiles), userId]);
      res.json({ success: true, activeWorkspace: selectedWorkspace });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/storage/providers
// The canonical provider registry is authoritative for enabled state and required configuration.
router.get('/storage/providers', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  try {
    const providers = await StorageServiceFacade.execute('getProviderCapabilities', {
      env: process.env as Record<string, unknown>,
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, providers });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Storage provider discovery is unavailable.',
    });
  }
});

router.post('/storage/backblaze/test', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.', buckets: [] });
    return;
  }
  const keyId = typeof req.body?.keyId === 'string' ? req.body.keyId : '';
  const applicationKey = typeof req.body?.applicationKey === 'string' ? req.body.applicationKey : '';
  try {
    const result = await StorageServiceFacade.execute('testBackblazeCredentials', { keyId, applicationKey }) as {
      success: boolean;
      buckets: Array<{ id: string; name: string; type?: string }>;
      error?: string;
    };
    res.setHeader('Cache-Control', 'no-store');
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      buckets: [],
      error: error instanceof Error ? error.message : 'Backblaze credential validation failed.',
    });
  }
});

router.post('/storage/backblaze', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  try {
    const connection = await StorageServiceFacade.execute('createBackblazeConnection', {
      userId,
      label: req.body?.label,
      keyId: req.body?.keyId,
      applicationKey: req.body?.applicationKey,
      bucketName: req.body?.bucketName,
      region: req.body?.region,
      endpoint: req.body?.endpoint,
      env: process.env as Record<string, unknown>,
    });
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ success: true, connection: connection && typeof connection === 'object' ? sanitizeStorageConnection(connection as UserStorageConnection) : null });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unable to create the Backblaze connection.',
    });
  }
});

// GET /api/workspaces/storage/connections
router.get('/storage/connections', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A logged-in ecosystem user ID is required.' }); return; }
  try {
    const conns = await getStorageConnections(userId);
    res.json({ success: true, connections: sanitizeStorageConnections(conns) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/storage/backblaze/accounts
// Return only opaque account IDs and display names; never serialize provider credentials.
router.get('/storage/backblaze/accounts', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A logged-in ecosystem user ID is required.' }); return; }
  try {
    const accounts = (await getStorageConnections(userId))
      .filter((connection) => connection.provider === 'backblaze_b2' && connection.enabled !== false)
      .map((connection) => ({ id: connection.id, name: connection.label || 'Backblaze B2', provider: 'backblaze_b2' }));
    res.json({ success: true, accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workspaces/storage/backblaze/buckets
// Resolve credentials by the authenticated user's opaque connection ID, never from browser input.
router.post('/storage/backblaze/buckets', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A logged-in ecosystem user ID is required.' }); return; }
  const accountId = String(req.body?.accountId || '').trim();
  if (!accountId) { res.status(400).json({ success: false, error: 'Backblaze account ID is required.' }); return; }
  try {
    const buckets = await StorageServiceFacade.execute('listBackblazeConnectionBuckets', {
      userId,
      connectionId: accountId,
      env: process.env as Record<string, unknown>,
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, buckets: Array.isArray(buckets) ? buckets : [] });
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message || 'Unable to list Backblaze buckets.' });
  }
});

// POST /api/workspaces/storage/test
// The browser supplies only an opaque ID. Connection secrets are resolved server-side.
router.post('/storage/test', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  const connectionId = String(req.body?.connectionId || req.body?.connection?.id || '').trim();
  if (!connectionId) {
    res.status(400).json({ success: false, error: 'A storage connection ID is required.' });
    return;
  }
  try {
    const connection = (await getStorageConnections(userId)).find((item) => item.id === connectionId);
    if (!connection) {
      res.status(404).json({ success: false, error: 'Storage connection was not found for this user.' });
      return;
    }
    const result = await testStorageConnection(connection);
    res.setHeader('Cache-Control', 'no-store');
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Storage connection test failed.',
    });
  }
});

// POST /api/workspaces/storage/connections
router.post('/storage/connections', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return; }
  try {
    const result = await saveStorageConnection(userId, req.body);
    res.json({ ...result, connection: result.connection ? sanitizeStorageConnections([result.connection])[0] : undefined, connections: sanitizeStorageConnections(result.connections) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/workspaces/storage/connections/:id
router.delete('/storage/connections/:id', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return; }
  try {
    const conns = await deleteStorageConnection(userId, req.params.id);
    res.json({ success: true, connections: sanitizeStorageConnections(conns) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces/storage/sync-clones
router.post('/storage/sync-clones', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return; }
  try {
    const result = await syncStorageClones(userId, req.body.cloneIds);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces/sync
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return; }
  try {
    const synced = await flushWorkspaceVault(userId, undefined, true);
    res.json({ success: true, synced });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/logs/:serviceId
router.get('/logs/:serviceId', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return; }
  const serviceId = req.params.serviceId;
  const limit = parseInt(req.query.limit as string) || 100;
  try {
    const { conn, folderPrefix } = await getWorkspaceVault(userId);
    const logs = await getServiceLogs(conn, folderPrefix, serviceId, limit);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces/logs/:serviceId
router.post('/logs/:serviceId', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return; }
  const serviceId = req.params.serviceId;
  const event = req.body;
  try {
    const { conn, folderPrefix } = await getWorkspaceVault(userId);
    await appendServiceLog(conn, folderPrefix, { ...event, serviceId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
