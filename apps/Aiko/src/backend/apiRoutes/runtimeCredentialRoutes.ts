import { Router, type Request, type Response } from 'express';
import { resolveAikoLuthUser, listAikoWorkspaces } from '../adapters/luthFetchAuth.js';
import { RuntimeProviderAccountService } from '../runtimeAccounts/RuntimeProviderAccountService.js';

export const runtimeCredentialRouter = Router();
const accountService = new RuntimeProviderAccountService();

function tokenFromRequest(req: Request): string {
  const authorization = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (authorization) return authorization;
  const apiKey = String(req.headers['x-api-key'] || '').trim();
  if (apiKey) return apiKey;
  const cookies = String(req.headers.cookie || '').split(';').map(item => item.trim());
  for (const p of ['better-auth.session_token=', '__Secure-better-auth.session_token=', 'luth_session=']) {
    const f = cookies.find(item => item.startsWith(p));
    if (f) { try { return decodeURIComponent(f.slice(p.length)); } catch {} }
  }
  return '';
}

async function authorizeWorkspace(req: Request, res: Response): Promise<boolean> {
  const token = tokenFromRequest(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'An authenticated Luth session is required.' });
    return false;
  }
  let user: any;
  try {
    user = await resolveAikoLuthUser(token, process.env);
  } catch {
    res.status(503).json({ success: false, error: 'Canonical Luth authentication service unavailable.' });
    return false;
  }
  if (!user?.id) {
    res.status(401).json({ success: false, error: 'The Luth session is invalid or expired.' });
    return false;
  }
  const workspaceId = String(req.params.workspace || '');
  try {
    const listing = await listAikoWorkspaces(user.id, { ...process.env, WORKSPACE_APP_ID: 'aiko' });
    const workspaces = listing.workspaces;
    const ownsWorkspace = workspaces.some((item: any) => String(item.id ?? item.workspaceId ?? item.workspace_id ?? '') === workspaceId);
    if (!ownsWorkspace) {
      res.status(403).json({ success: false, error: 'The requested workspace is not accessible to this Luth user.' });
      return false;
    }
    return true;
  } catch {
    res.status(503).json({ success: false, error: 'Unable to verify Luth workspace ownership.' });
    return false;
  }
}

function failure(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : 'Runtime account operation failed.';
  const status = message.includes('not found') ? 404 : 400;
  return res.status(status).json({ success: false, error: message });
}

runtimeCredentialRouter.get('/runtime/providers', (_req, res) => {
  return res.json({ success: true, providers: accountService.listProviders() });
});

runtimeCredentialRouter.get('/workspaces/:workspace/runtime/accounts', async (req, res) => {
  try {
    if (!(await authorizeWorkspace(req, res))) return;
    const accounts = await accountService.list(req.params.workspace);
    return res.json({ success: true, accounts, providers: accountService.listProviders() });
  } catch {
    return res.status(500).json({ success: false, error: 'Unable to load runtime accounts.' });
  }
});

runtimeCredentialRouter.post('/workspaces/:workspace/runtime/accounts', async (req, res) => {
  try {
    if (!(await authorizeWorkspace(req, res))) return;
    const account = await accountService.create(req.params.workspace, {
      providerId: req.body?.providerId,
      displayName: req.body?.displayName,
      emailGroup: req.body?.emailGroup,
      fields: req.body?.fields,
    });
    return res.status(201).json({ success: true, account });
  } catch (error) {
    return failure(res, error);
  }
});

runtimeCredentialRouter.put('/workspaces/:workspace/runtime/accounts/:accountId', async (req, res) => {
  try {
    if (!(await authorizeWorkspace(req, res))) return;
    const account = await accountService.update(req.params.workspace, req.params.accountId, {
      providerId: req.body?.providerId,
      displayName: req.body?.displayName,
      emailGroup: req.body?.emailGroup,
      fields: req.body?.fields,
    });
    return res.json({ success: true, account });
  } catch (error) {
    return failure(res, error);
  }
});

runtimeCredentialRouter.delete('/workspaces/:workspace/runtime/accounts/:accountId', async (req, res) => {
  try {
    if (!(await authorizeWorkspace(req, res))) return;
    const deleted = await accountService.delete(req.params.workspace, req.params.accountId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Runtime account not found.' });
    return res.json({ success: true });
  } catch (error) {
    return failure(res, error);
  }
});
