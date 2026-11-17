/**
 * @file authCore.ts
 * @description Compatibility auth facade. Identity, credentials and sessions belong to Luth.
 */
import { createLuthAuthClient, type LuthAuthTokenStore, type LuthUser } from '@ultrst-armada/kloks/auth';
import { queryUnifiedDb } from './unifiedDb';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  username: string;
  role: 'user';
  image?: string | null;
}

function createTokenStore(initial = ''): LuthAuthTokenStore {
  let token = initial;
  return {
    get: () => token,
    set: (value) => { token = value; },
    clear: () => { token = ''; },
  };
}

function createClient(token = '') {
  return createLuthAuthClient({
    ecosystemId: 'ultrst-armada',
    applicationId: 'srkl',
    tokenStore: createTokenStore(token),
  });
}

function toAuthUser(user: LuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.email.split('@')[0],
    role: 'user',
    image: user.image,
  };
}

/** Compatibility login forwards credentials to Luth; SRKL never verifies or stores passwords. */
export async function loginUser(
  email: string,
  password: string,
  isAdmin = false,
  _env?: Record<string, unknown>,
): Promise<{ status: number; success: boolean; user?: AuthUser; token?: string; error?: string }> {
  if (isAdmin) return { status: 403, success: false, error: 'Administrative authentication is managed by Luth.' };
  if (!email?.trim() || !password) return { status: 400, success: false, error: 'Email and password are required.' };

  try {
    const client = createClient();
    await client.signInWithEmail({ email: email.trim(), password });
    const session = await client.getSession();
    if (!session.authenticated || !session.user) {
      return { status: 401, success: false, error: 'Luth did not establish an authenticated session.' };
    }
    const authorization = new Headers(client.getAuthHeaders()).get('authorization') || '';
    const token = authorization.replace(/^Bearer\s+/i, '').trim();
    if (!token) return { status: 502, success: false, error: 'Luth did not return a session token.' };
    return { status: 200, success: true, user: toAuthUser(session.user), token };
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error
      && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 503;
    return {
      status,
      success: false,
      error: error instanceof Error ? error.message : 'Canonical Luth authentication service unavailable.',
    };
  }
}

/** Resolve identity from a Luth token. User IDs are never accepted as credentials. */
export async function getCurrentUser(token: string, _env?: Record<string, unknown>): Promise<AuthUser | null> {
  const credential = String(token || '').replace(/^Bearer\\s+/i, '').trim();
  if (!credential) return null;
  try {
    const session = await createClient(credential).getSession();
    return session.authenticated && session.user ? toAuthUser(session.user) : null;
  } catch {
    return null;
  }
}

export const resolveUserFromToken = getCurrentUser;

/** Application profile lookup only; credential columns are intentionally excluded. */
export async function findUserByEmail(email: string, env?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (!email?.trim()) return null;
  try {
    const result = await queryUnifiedDb(
      'SELECT id, email, username, name, role, app_profiles, created_at, updated_at FROM "srkl_application_profiles" WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email.trim()],
      env,
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}
