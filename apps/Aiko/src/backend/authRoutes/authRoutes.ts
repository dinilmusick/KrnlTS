import { Router, Request, Response } from 'express';
import { createLuthAuthClient, DEFAULT_LUTH_URL } from '@dinilmusick/gutts/auth';
import { resolveAikoLuthUser } from '../adapters/luthFetchAuth.js';
import { getNodeWorkspaceService } from '../storage/workspaceStorage.js';

export const authRouter = Router();
export const databaseRouter = Router();

function tokenFromRequest(req: Request): string {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

function setSessionCookie(res: Response, token?: string) {
  if (!token) return;
  const secure = String(process.env.APP_URL || '').startsWith('https://') ? '; Secure' : '';
  res.setHeader('Set-Cookie', 'luth_session=' + encodeURIComponent(token) + '; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800' + secure);
}
function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', 'luth_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
}

function client(token = '') {
  const tokenStore = (() => {
    let value = token;
    return { get: () => value, set: (next: string) => { value = next; }, clear: () => { value = ''; } };
  })();
  return createLuthAuthClient({
    ecosystemId: 'ultrst-armada',
    applicationId: 'aiko',
    luthUrl: DEFAULT_LUTH_URL,
    autoRegister: false,
    tokenStore,
  });
}

async function currentUser(req: Request) {
  const token = tokenFromRequest(req);
  if (!token) return null;
  return resolveAikoLuthUser(token, process.env);
}

function workspaceEnv() {
  return { WORKSPACE_APP_ID: 'aiko' };
}

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required.' });
  try {
    const auth = client();
    await auth.signInWithEmail({ email: String(email), password: String(password) });
    const session = await auth.getSession();
    if (!session.authenticated || !session.user) return res.status(401).json({ success: false, error: 'Luth did not establish a session.' });
    const token = new Headers(auth.getAuthHeaders()).get('authorization')?.replace(/^Bearer\s+/i, '');
    setSessionCookie(res, token);
    return res.json({ success: true, user: session.user, session: session.session, source: 'luth' });
  } catch (error) {
    return res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Luth authentication unavailable.' });
  }
});

authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required.' });
  try {
    const auth = client();
    await auth.signUpWithEmail({ email: String(email), password: String(password), name: String(name || '') });
    const session = await auth.getSession();
    const token = new Headers(auth.getAuthHeaders()).get('authorization')?.replace(/^Bearer\s+/i, '');
    setSessionCookie(res, token);
    return res.status(201).json({ success: session.authenticated, user: session.user, session: session.session, source: 'luth' });
  } catch (error) {
    return res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Luth registration unavailable.' });
  }
});

authRouter.get('/me', async (req: Request, res: Response) => {
  const user = await currentUser(req);
  return user ? res.json({ success: true, user }) : res.status(401).json({ success: false, error: 'Unauthenticated session' });
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = tokenFromRequest(req);
  if (token) {
    try { await client(token).signOut(); } catch {}
  }
  clearSessionCookie(res);
  return res.json({ success: true });
});

authRouter.get('/workspaces', async (req: Request, res: Response) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthenticated session' });
  const service = await getNodeWorkspaceService();
  if (!service) return res.status(503).json({ success: false, error: 'Workspace service unavailable.' });
  return res.json(await service.listWorkspaces(user.id, workspaceEnv()));
});

authRouter.post('/workspaces', async (req: Request, res: Response) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthenticated session' });
  const { name, description, ...rest } = req.body || {};
  if (!name) return res.status(400).json({ success: false, error: 'Workspace name is required.' });
  const service = await getNodeWorkspaceService();
  if (!service) return res.status(503).json({ success: false, error: 'Workspace service unavailable.' });
  return res.json(await service.createWorkspace(user.id, { name, description, ...rest }, workspaceEnv()));
});

authRouter.delete('/workspaces/:id', async (req: Request, res: Response) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthenticated session' });
  const service = await getNodeWorkspaceService();
  if (!service) return res.status(503).json({ success: false, error: 'Workspace service unavailable.' });
  return res.json(await service.deleteWorkspace(user.id, req.params.id, workspaceEnv()));
});

function databaseConfigured() {
  return Boolean(process.env.SYSTEM_DATABASE_URL || process.env.SYSTEM_DATABASE_URL_2 || process.env.SYSTEM_DATABASE_URL_3);
}

databaseRouter.get('/status', (_req: Request, res: Response) => res.json({ success: true, cluster: { engine: 'canonical_system_database', role: 'primary', status: databaseConfigured() ? 'configured' : 'offline' } }));
databaseRouter.post('/test', async (_req: Request, res: Response) => res.json({ success: databaseConfigured(), message: databaseConfigured() ? 'System database configuration is present.' : 'System database URL is not configured.' }));
authRouter.get('/database/status', (_req: Request, res: Response) => res.json({ success: true, status: databaseConfigured() ? 'configured' : 'offline' }));
authRouter.post('/database/test', async (_req: Request, res: Response) => res.json({ success: databaseConfigured(), message: databaseConfigured() ? 'System database configuration is present.' : 'System database URL is not configured.' }));

export default authRouter;
