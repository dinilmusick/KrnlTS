import { createLuthAuthClient, DEFAULT_LUTH_URL } from '@dinilmusick/gutts/auth';
import { WorkspaceServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';

export interface AikoLuthPrincipal {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  role: string;
  [key: string]: unknown;
}

function createTokenStore(initialToken = '') {
  let token = initialToken;
  return {
    get: () => token,
    set: (next: string) => { token = next; },
    clear: () => { token = ''; },
  };
}

/** Verify a bearer/cookie token against the canonical Luth session endpoint. */
export async function resolveAikoLuthUser(
  token: string,
  env: Record<string, unknown> = {},
): Promise<AikoLuthPrincipal | null> {
  const credential = String(token || '').trim().replace(/^Bearer\s+/i, '').trim();
  if (!credential) return null;

  const auth = createLuthAuthClient({
    ecosystemId: 'ultrst-armada',
    applicationId: 'aiko',
    luthUrl: DEFAULT_LUTH_URL,
    origin: typeof env.APP_URL === 'string' && env.APP_URL.trim()
      ? env.APP_URL.trim()
      : DEFAULT_LUTH_URL,
    autoRegister: false,
    tokenStore: createTokenStore(credential),
  });
  const session = await auth.getSession();
  if (!session.authenticated || !session.user?.id) return null;
  return {
    ...session.user,
    id: String(session.user.id),
    role: String((session.user as { role?: unknown }).role || 'user'),
  };
}

/**
 * Workspace membership and storage metadata are read through Kloks' canonical
 * unified database/workspace service in every runtime. The Luth principal is
 * resolved by the caller; this helper never trusts a browser-supplied owner ID.
 */
export async function listAikoWorkspaces(
  userId: string,
  env: Record<string, unknown> = {},
): Promise<{ success: boolean; workspaces: any[]; activeWorkspaceId: string | null; storage_connections: any[] }> {
  if (!userId) return { success: true, workspaces: [], activeWorkspaceId: null, storage_connections: [] };
  const result = await WorkspaceServiceFacade.execute('listWorkspaces', {
    userId,
    env: { ...env, WORKSPACE_APP_ID: 'aiko' },
  }) as {
    success?: boolean;
    workspaces?: any[];
    activeWorkspaceId?: string | null;
    storage_connections?: any[];
  };
  return {
    success: result?.success !== false,
    workspaces: Array.isArray(result?.workspaces) ? result.workspaces : [],
    activeWorkspaceId: result?.activeWorkspaceId || null,
    storage_connections: Array.isArray(result?.storage_connections) ? result.storage_connections : [],
  };
}
