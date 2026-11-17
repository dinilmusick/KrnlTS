/**
 * @file vaultRoutes.ts
 * @description HTTP Route Handlers for Workspace-Scoped Credential Vault & SRKL Sync (< 200 lines).
 */

import { DepmBackend } from '../DepmBackend';

export function getVaultKey(req: Request, url: URL, userId: string): string {
  const headerKey = req.headers.get('x-vault-key');
  if (headerKey) return headerKey.trim();
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return `depm_vault_${userId || 'default_session'}`;
}

export async function handleVaultRoutes(
  request: Request,
  url: URL,
  userId: string,
  env: Record<string, unknown>,
  jsonRes: (data: unknown, status?: number) => Response,
  parseBody: (req: Request) => Promise<any>
): Promise<Response | null> {
  const { pathname } = url;
  const { method } = request;
  const vaultKey = getVaultKey(request, url, userId);

  // 1. Sync accounts from SRKL into active workspace vault
  if (pathname === '/api/srkl/accounts/sync' && method === 'POST') {
    const b = await parseBody(request);
    const wsId = url.searchParams.get('workspaceId') || b.workspaceId;
    if (!wsId) return jsonRes({ success: false, error: 'workspaceId is required' }, 400);
    try {
      const res = await DepmBackend.services.srkl.syncSrklAccountsToWorkspace(wsId, userId, vaultKey, env);
      return jsonRes(res);
    } catch (err: any) {
      return jsonRes({ success: false, error: err.message }, 500);
    }
  }

  // 2. Read workspace accounts from vault (no SRKL call needed)
  if (pathname === '/api/workspace/accounts' && method === 'GET') {
    const wsId = url.searchParams.get('workspaceId');
    if (!wsId) return jsonRes({ success: false, error: 'workspaceId is required' }, 400);
    const includeSecrets = url.searchParams.get('includeSecrets') === 'true';
    try {
      const res = await DepmBackend.services.srkl.getWorkspaceAccounts(wsId, userId, vaultKey, env, includeSecrets);
      return jsonRes(res);
    } catch (err: any) {
      return jsonRes({ success: false, error: err.message }, 500);
    }
  }

  // 3. Vault credentials CRUD
  if (pathname === '/api/vault/credentials') {
    const wsId = url.searchParams.get('workspaceId');
    const { workspace, connection } = wsId ? await DepmBackend.services.workspace.findUserWorkspace(wsId, env) : { workspace: null, connection: null };
    if (!workspace) return jsonRes({ success: false, error: 'Valid workspaceId is required' }, 400);

    if (method === 'GET') {
      const entries = await DepmBackend.services.vault.listCredentials(workspace, connection);
      return jsonRes({ success: true, count: entries.length, credentials: entries });
    }
    if (method === 'POST') {
      const b = await parseBody(request);
      const entry = await DepmBackend.services.vault.createCredential(workspace, connection, b, vaultKey);
      return jsonRes({ success: true, credential: entry }, 201);
    }
  }

  const credMatch = pathname.match(/^\/api\/vault\/credentials\/([^/]+)$/);
  if (credMatch) {
    const credId = credMatch[1];
    const wsId = url.searchParams.get('workspaceId');
    const { workspace, connection } = wsId ? await DepmBackend.services.workspace.findUserWorkspace(wsId, env) : { workspace: null, connection: null };
    if (!workspace) return jsonRes({ success: false, error: 'Valid workspaceId is required' }, 400);

    if (method === 'GET') {
      try {
        const cred = await DepmBackend.services.vault.getCredential(workspace, connection, credId, vaultKey);
        return jsonRes({ success: true, credential: cred });
      } catch (err: any) {
        return jsonRes({ success: false, error: err.message }, 404);
      }
    }
    if (method === 'PUT') {
      const b = await parseBody(request);
      const entry = await DepmBackend.services.vault.updateCredential(workspace, connection, credId, b, vaultKey);
      return jsonRes({ success: true, credential: entry });
    }
    if (method === 'DELETE') {
      await DepmBackend.services.vault.deleteCredential(workspace, connection, credId);
      return jsonRes({ success: true, deletedId: credId });
    }
  }

  return null;
}
