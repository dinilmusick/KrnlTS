/**
 * @file ecosystem.ts
 * @description Secure Ecosystem Service Credential & Vault-Access API for SRKL.
 * Provides client-side SQLite vault access references for ecosystem apps (e.g. DEPM)
 * burning zero SRKL server resources for credential parsing and filtering.
 * Adheres strictly to Skipo governance (< 200 lines).
 */

import express, { Request, Response } from 'express';
import { query } from '../db';
import { getWorkspaceVault, getUserWorkspaceContext } from '../storage/workspaceVaultCoordinator';
import { generatePresignedVaultUrl, deriveClientVaultKeyMaterial } from '../storage/vaultAccessPresigner';
import { addAuditLog } from '../audit';
import { resolveEcosystemAccounts } from './ecosystemAccountResolver';
import { authenticateRequest, authorizeEcosystemAccess } from './ecosystemAuthHelper';
import { getVerifiedPrincipal } from '../luthSession';

const router = express.Router();

function getUserId(req: Request): string {
  return getVerifiedPrincipal(req)?.id || '';
}

async function resolveUserWorkspaces(userId: string): Promise<{ workspaces: any[]; activeWorkspaceId: string }> {
  const res = await query('SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1', [userId]);
  if (!res.rows.length) return { workspaces: [], activeWorkspaceId: '' };
  const p = typeof res.rows[0].app_profiles === 'string' ? JSON.parse(res.rows[0].app_profiles) : (res.rows[0].app_profiles || {});
  const srkl = p.srkl || {};
  return { workspaces: srkl.workspaces || [], activeWorkspaceId: srkl.activeWorkspaceId || '' };
}

// GET /api/ecosystem/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ONLINE', app: 'srkl', engine: 'srkl-service-broker', timestamp: new Date().toISOString() });
});

// POST /api/ecosystem/vault-access
// Provides presigned URL + client decryption key for browser-side SQLite execution (e.g. DEPM)
router.post('/vault-access', async (req: Request, res: Response): Promise<void> => {
  const principal = authenticateRequest(req);
  if (!principal) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  const callerUserId = (req.query.userId || req.body?.userId) as string | undefined;
  if (callerUserId && callerUserId.trim() !== principal.userId) {
    res.status(403).json({ success: false, error: 'Forbidden: authenticated principal cannot access vault for another user' });
    return;
  }
  const userId = principal.userId;
  const targetWsParam = (req.headers['x-workspace-id'] || req.query.workspaceId || req.body?.workspaceId) as string | undefined;
  const appId = (req.headers['x-app-id'] || req.body?.appId || 'depm') as string;

  try {
    const appRes = await query('SELECT * FROM "ultrst-apps" WHERE app_id = $1 AND status = \'active\'', [appId]);
    const registeredApp = appRes.rows[0] || null;
    const supportedServices: string[] = registeredApp?.supported_services || req.body?.supportedServices || [];

    const { workspaces, activeWorkspaceId } = await resolveUserWorkspaces(userId);
    const effectiveWsId = (targetWsParam && targetWsParam !== 'active') ? targetWsParam : (activeWorkspaceId || workspaces[0]?.id);
    if (!effectiveWsId) { res.status(404).json({ success: false, error: 'No workspace found for user' }); return; }

    const wsContext = await getUserWorkspaceContext(userId, effectiveWsId);
    if (!wsContext || !wsContext.conn) {
      res.status(400).json({ success: false, error: 'Cloud storage vault connection unavailable for this workspace' });
      return;
    }

    const ttlSeconds = 900;
    const presignedUrl = await generatePresignedVaultUrl(wsContext.conn, wsContext.folderPrefix, ttlSeconds);
    const keyMaterial = deriveClientVaultKeyMaterial(userId, effectiveWsId);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    await addAuditLog('ECOSYSTEM_VAULT_ACCESS_ISSUED', userId, `Issued 15m client vault reference to app "${appId}" for workspace "${wsContext.workspace.name}"`, 'ecosystem');

    res.json({
      success: true, appId, workspaceId: effectiveWsId, workspaceName: wsContext.workspace.name,
      folderPrefix: wsContext.folderPrefix, storageProvider: wsContext.conn.provider,
      presignedUrl, keyMaterial, supportedServices, expiresAt, ttlSeconds,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ecosystem/apps
router.get('/apps', async (_req: Request, res: Response): Promise<void> => {
  try {
    const resApps = await query('SELECT app_id, name, description, supported_services, status FROM "ultrst-apps" WHERE status = \'active\'');
    res.json({ success: true, apps: resApps.rows });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// Legacy direct query endpoint maintained for backward compatibility
router.get('/services', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'A logged-in ecosystem user ID is required.' }); return; }
  const targetWsParam = (req.headers['x-workspace-id'] || req.query.workspaceId) as string | undefined;
  try {
    const { workspaces, activeWorkspaceId } = await resolveUserWorkspaces(userId);
    const targetWsId = (targetWsParam && targetWsParam !== 'active') ? targetWsParam : activeWorkspaceId;
    const effectiveWsId = targetWsId || workspaces[0]?.id;
    if (!effectiveWsId) { res.json({ success: true, services: [] }); return; }
    const { manager } = await getWorkspaceVault(userId, effectiveWsId);
    const accounts = manager.getServiceAccounts();
    res.json({ success: true, userId, workspaceId: effectiveWsId, count: accounts.length, services: accounts });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/ecosystem/accounts - Standard Skipo App Manifest Broker
router.post('/accounts', async (req: Request, res: Response): Promise<void> => {
  const manifest = req.body?.manifest || req.body || {};
  const targetWsParam = (req.headers['x-workspace-id'] || req.query.workspaceId || req.body?.workspaceId) as string | undefined;
  const decision = await authorizeEcosystemAccess(req, manifest, targetWsParam);
  if (decision.error) {
    res.status(decision.statusCode || 401).json({ success: false, error: decision.error });
    return;
  }
  const appId = ((req.headers['x-app-id'] || manifest.appId || 'generic') as string).toLowerCase();
  try {
    const result = await resolveEcosystemAccounts(decision.userId, manifest, decision.workspaceId, {
      includeCredentials: decision.includeCredentials,
    });
    res.json({ success: true, appId, userId: decision.userId, ...result });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/ecosystem/accounts/register - Canonical account registration.
router.post('/accounts/register', async (req: Request, res: Response): Promise<void> => {
  const principal = authenticateRequest(req);
  const caller = ((req.query.userId || req.body?.userId) as string | undefined)?.trim();
  if (!principal) { res.status(401).json({ success: false, error: 'Authentication required to register ecosystem accounts.' }); return; }
  if (caller && caller !== principal.userId) {
    res.status(403).json({ success: false, error: `Forbidden: authenticated principal cannot register accounts for "${caller}"` });
    return;
  }
  const userId = principal.userId;
  const account = req.body?.account || req.body;
  if (!account?.serviceId) { res.status(400).json({ success: false, error: 'serviceId is required.' }); return; }
  try {
    const userRes = await query('SELECT id, app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $1 LIMIT 1', [userId]);
    if (!userRes.rows.length) { res.status(404).json({ success: false, error: 'User not found.' }); return; }
    const user = userRes.rows[0];
    const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
    if (!appProfiles.srkl) appProfiles.srkl = {};
    const accounts = Array.isArray(appProfiles.srkl.accounts) ? appProfiles.srkl.accounts : [];
    const id = account.id || `acct-${account.serviceId}-${Date.now()}`;
    const now = new Date().toISOString();
    const entry = {
      ...account, id, provider: account.provider || account.serviceId, category: account.category || 'general',
      status: account.status || 'CONNECTED', credentials: account.credentials || {}, createdAt: account.createdAt || now, updatedAt: now,
    };
    const idx = accounts.findIndex((a: any) => a.id === id);
    if (idx >= 0) accounts[idx] = { ...accounts[idx], ...entry }; else accounts.push(entry);
    appProfiles.srkl.accounts = accounts;
    await query('UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;', [JSON.stringify(appProfiles), user.id]);
    const presentation = { ...entry };
    delete presentation.credentials;
    res.status(idx >= 0 ? 200 : 201).json({ success: true, account: presentation, presentation });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/ecosystem/accounts - Compatible query parameter broker (safe presentation)
router.get('/accounts', async (req: Request, res: Response): Promise<void> => {
  const principal = authenticateRequest(req);
  if (!principal) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  const caller = (req.query.userId as string | undefined)?.trim();
  if (caller && caller !== principal.userId) {
    res.status(403).json({ success: false, error: `Forbidden: authenticated principal cannot access accounts for "${caller}"` });
    return;
  }
  const userId = principal.userId;
  const appId = (req.headers['x-app-id'] || req.query.appId || 'generic') as string;
  const servicesParam = req.query.services as string | undefined;
  const categoriesParam = req.query.categories as string | undefined;
  const manifest = {
    appId, appName: appId,
    requiredServices: servicesParam ? servicesParam.split(',') : undefined,
    categories: categoriesParam ? (categoriesParam.split(',') as any[]) : undefined,
    includeCredentials: false,
  };
  const targetWsParam = (req.headers['x-workspace-id'] || req.query.workspaceId) as string | undefined;
  try {
    const result = await resolveEcosystemAccounts(userId, manifest, targetWsParam, { includeCredentials: false });
    res.json({ success: true, appId, userId, ...result });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
