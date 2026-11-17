/**
 * @file authHelpers.ts
 * @description SRKL application-profile helpers; identity and credentials belong to Luth.
 */
import { query } from './db';
import { formatCanonicalWorkspacePath } from './storage/workspaceCanonical';

export async function findEcosystemUserById(userId: string): Promise<any | null> {
  try {
    const res = await query('SELECT id, email, username, name, role, app_profiles, created_at, updated_at FROM "srkl_application_profiles" WHERE id = $1', [userId]);
    if (res.rows.length > 0) return res.rows[0];
  } catch {}
  return null;
}

export function createDefaultAppProfiles(userName = 'user') {
  const workspacePath = formatCanonicalWorkspacePath('srkl', userName, 'vault');
  const workspaceName = 'SRKL Vault';
  return {
    srkl: {
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      workspacePath,
      workspaceName,
      activeWorkspaceId: 'ws-srkl-default',
      workspaces: [{ id: 'ws-srkl-default', name: workspaceName, workspacePath, storageProvider: 'local_fs' }],
      storage_connections: [],
      cluster_connections: [],
      custom_definitions: [],
    },
  };
}
