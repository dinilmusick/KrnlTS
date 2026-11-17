import { Router, type Request, type Response } from 'express';
import { resolveAikoLuthUser, listAikoWorkspaces } from '../adapters/luthFetchAuth.js';
import { RuntimeProviderError } from '../runtime/errors.js';
import { RuntimeNodeAdapter } from '../runtime/RuntimeNodeAdapter.js';
import { runtimeService } from '../runtime/index.js';

export const runtimeRouter = Router();
const runtimeNodes = new RuntimeNodeAdapter(runtimeService);
async function authorize(req: Request, res: Response): Promise<boolean> {
  const authorization = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const apiKey = String(req.headers['x-api-key'] || '').trim();
  const cookies = String(req.headers.cookie || '').split(';').map(item => item.trim());
  let cookieToken = '';
  for (const p of ['better-auth.session_token=', '__Secure-better-auth.session_token=', 'luth_session=']) {
    const f = cookies.find(item => item.startsWith(p));
    if (f) { try { cookieToken = decodeURIComponent(f.slice(p.length)); break; } catch {} }
  }
  const token = authorization || apiKey || cookieToken;
  if (!token) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return false; }
  let principal: any;
  try { principal = await resolveAikoLuthUser(token, process.env); }
  catch { res.status(503).json({ success: false, error: 'Canonical Luth authentication service unavailable.' }); return false; }
  if (!principal?.id) { res.status(401).json({ success: false, error: 'The Luth session is invalid or expired.' }); return false; }
  const workspaceId = String(req.params.workspace || '');
  if (workspaceId) {
    try {
      const listing = await listAikoWorkspaces(principal.id, { ...process.env, WORKSPACE_APP_ID: 'aiko' });
      const workspaces = listing.workspaces;
      if (!workspaces.some((item: any) => String(item.id ?? item.workspaceId ?? item.workspace_id ?? '') === workspaceId)) {
        res.status(403).json({ success: false, error: 'The requested workspace is not accessible to this Luth user.' }); return false;
      }
    } catch { res.status(503).json({ success: false, error: 'Unable to verify Luth workspace ownership.' }); return false; }
  }
  return true;
}
function safeRuntimeAccount(account: any) { const safe = { ...(account || {}) }; delete safe.credentialRef; return safe; }
function fail(res: Response, error: unknown) {
  const code = error instanceof RuntimeProviderError ? error.code : 'RUNTIME_OPERATION_FAILED';
  const status = code === 'AUTHENTICATION_FAILED' ? 401 : code === 'QUOTA_EXHAUSTED' ? 429 :
    code === 'PROVIDER_UNAVAILABLE' || code === 'CONNECTION_FAILED' ? 503 :
    code === 'RUNTIME_NOT_FOUND' ? 404 : code === 'CAPABILITY_UNSUPPORTED' ? 422 : 400;
  return res.status(status).json({ success: false, error: { code, message: error instanceof Error ? error.message : String(error) } });
}
runtimeRouter.get('/module/runtime/providers', async (req, res) => {
  if (!(await authorize(req, res))) return;
  return res.json({ success: true, providers: runtimeService.listProviders() });
});
runtimeRouter.get('/module/runtime/nodes', async (req, res) => {
  if (!(await authorize(req, res))) return;
  return res.json({ success: true, nodes: runtimeNodes.definitions() });
});
runtimeRouter.post('/module/runtime/describe', async (req, res) => {
  if (!(await authorize(req, res))) return;
  try { return res.json({ success: true, resource: runtimeService.describeConfiguration(req.body?.providerId, req.body?.configuration || {}) }); }
  catch (error) { return fail(res, error); }
});
runtimeRouter.get('/module/workspaces/:workspace/runtime/accounts', async (req, res) => {
  if (!(await authorize(req, res))) return;
  try { return res.json({ success: true, accounts: (await runtimeService.listAccounts(req.params.workspace)).map(safeRuntimeAccount) }); }
  catch (error) { return fail(res, error); }
});
runtimeRouter.put('/module/workspaces/:workspace/runtime/accounts/:accountId', async (req, res) => {
  if (!(await authorize(req, res))) return;
  try {
    const account = await runtimeService.saveAccount(req.params.workspace, { ...req.body, id: req.params.accountId });
    return res.json({ success: true, account });
  } catch (error) { return fail(res, error); }
});
runtimeRouter.post('/module/workspaces/:workspace/runtime/spawn', async (req, res) => {
  if (!(await authorize(req, res))) return;
  try { return res.status(201).json({ success: true, runtime: await runtimeService.spawn({ ...req.body, workspaceId: req.params.workspace }) }); }
  catch (error) { return fail(res, error); }
});
runtimeRouter.get('/module/workspaces/:workspace/runtime/:handleId/status', async (req, res) => {
  if (!(await authorize(req, res))) return;
  try { return res.json({ success: true, runtime: await runtimeService.status(req.params.workspace, req.params.handleId) }); }
  catch (error) { return fail(res, error); }
});
runtimeRouter.post('/module/workspaces/:workspace/runtime/:handleId/execute', async (req, res) => {
  if (!(await authorize(req, res))) return;
  try { return res.json({ success: true, ...(await runtimeService.execute(req.params.workspace, req.params.handleId, req.body || {})) }); }
  catch (error) { return fail(res, error); }
});
runtimeRouter.delete('/module/workspaces/:workspace/runtime/:handleId', async (req, res) => {
  if (!(await authorize(req, res))) return;
  try { return res.json({ success: true, runtime: await runtimeService.terminate(req.params.workspace, req.params.handleId) }); }
  catch (error) { return fail(res, error); }
});
runtimeRouter.post('/module/workspaces/:workspace/runtime/cleanup', async (req, res) => {
  if (!(await authorize(req, res))) return;
  try {
    if (typeof req.body?.executionId !== 'string' || !req.body.executionId) return res.status(400).json({ success: false, error: 'executionId is required.' });
    return res.json({ success: true, results: await runtimeService.cleanupTransient(req.params.workspace, req.body.executionId) });
  } catch (error) { return fail(res, error); }
});
