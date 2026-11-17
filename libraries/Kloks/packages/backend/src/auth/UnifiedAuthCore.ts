import {
  LuthAuthClient,
  DEFAULT_LUTH_URL,
  type LuthAuthTokenStore,
  type LuthSessionResult,
} from '@dinilmusick/gutts/auth';

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  status: string;
  appProfiles?: Record<string, unknown>;
  emailVerified?: boolean;
}

export type AuthEnvironment = Record<string, unknown>;

function tokenStore(initial = ''): LuthAuthTokenStore {
  let token = initial;
  return {
    get: () => token,
    set: (value) => { token = value; },
    clear: () => { token = ''; },
  };
}

function createClient(_env: AuthEnvironment | undefined, token = ''): LuthAuthClient {
  return new LuthAuthClient({
    ecosystemId: 'ultrst-armada',
    applicationId: 'kloks-backend',
    luthUrl: DEFAULT_LUTH_URL,
    origin: process.env.APP_URL || DEFAULT_LUTH_URL,
    autoRegister: false,
    tokenStore: tokenStore(token),
  });
}

function toSystemUser(user: NonNullable<LuthSessionResult['user']>): SystemUser {
  return {
    ...user,
    username: user.email.split('@')[0],
    role: 'user',
    status: 'ACTIVE',
  };
}

export async function loginSystemUser(
  email: string,
  rawPass: string,
  isAdmin: boolean,
  _queryDb: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>,
  env?: AuthEnvironment,
): Promise<{ success: boolean; status: number; token?: string; user?: SystemUser; error?: string }> {
  if (!email?.trim() || !rawPass) return { success: false, status: 400, error: 'Email and password are required' };
  if (isAdmin) return { success: false, status: 403, error: 'Administrative authentication is not provided by canonical Luth user login.' };

  try {
    const client = createClient(env);
    await client.signInWithEmail({ email: email.trim(), password: rawPass });
    const session = await client.getSession();
    if (!session.authenticated || !session.user || !session.session) {
      return { success: false, status: 401, error: 'Canonical authentication service did not establish a session.' };
    }
    const user = toSystemUser(session.user);
    const authorization = (client.getAuthHeaders() as Record<string, string>).Authorization || '';
    const token = authorization.replace(/^Bearer\s+/i, '').trim();
    if (!token) return { success: false, status: 502, error: 'Luth did not return a usable bearer session token.' };
    return {
      success: true,
      status: 200,
      user,
      token,
    };
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error
      && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 503;
    return { success: false, status, error: error instanceof Error ? error.message : 'Canonical authentication service unavailable' };
  }
}

export async function resolveUserFromToken(
  tokenOrUserId: string,
  _queryDb: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>,
  env?: AuthEnvironment,
): Promise<SystemUser | null> {
  if (!tokenOrUserId) return null;
  try {
    const credential = tokenOrUserId.trim().replace(/^Bearer[ \t]+/i, '').trim();
    if (!credential) return null;
    const client = createClient(env, credential);
    const session = await client.getSession();
    if (!session.authenticated || !session.user) return null;
    return toSystemUser(session.user);
  } catch {
    return null;
  }
}
