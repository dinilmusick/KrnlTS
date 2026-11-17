/**
 * @file workspaceCanonical.ts
 * @description Canonical workspace naming conventions conforming to the ULTRST standard.
 * Identical across Depm, Qwnsr, and Loky.
 */

export function formatCanonicalWorkspaceFolderName(appName: string, userName: string, workspaceName: string): string {
  const safeApp = (appName || 'qwnsr').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const safeUser = (userName || 'user').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const safeWs = (workspaceName || 'workspace').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `ultrst_${safeApp}_${safeUser}_${safeWs}`;
}

export function sanitizeWorkspaceName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_\s]/g, '').trim();
}
