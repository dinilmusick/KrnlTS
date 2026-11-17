export function formatCanonicalWorkspaceFolderName(appName: string, userName: string, workspaceName: string): string {
  const safeApp = appName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const safeUser = userName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const safeWs = workspaceName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `ultrst_${safeApp}_${safeUser}_${safeWs}`;
}

export function sanitizeWorkspaceName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_\s]/g, '').trim();
}
