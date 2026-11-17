/**
 * @file workspaceCanonical.ts
 * @description Pure client-safe workspace name sanitization and canonical formatting.
 * Conforms to APP_ARCHITECTURE_SPEC Section 25.
 */

export function sanitizeFolderSegment(val: string): string {
  return (val || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'default';
}

export function formatCanonicalWorkspaceFolderName(
  appName: string = 'srkl',
  userName: string = 'user',
  workspaceName: string = 'default'
): string {
  const cleanApp = sanitizeFolderSegment(appName);
  const cleanUser = sanitizeFolderSegment(userName);
  const cleanWs = sanitizeFolderSegment(workspaceName);
  return `ultrst_${cleanApp}_${cleanUser}_${cleanWs}`;
}
