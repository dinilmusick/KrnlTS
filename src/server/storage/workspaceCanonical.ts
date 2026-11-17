/**
 * ══════════════════════════════════════════════════════════════════════════════
 * UNIVERSAL CANONICAL WORKSPACE NAMING LAW (SRKL)
 * ══════════════════════════════════════════════════════════════════════════════
 * Formula: ultrst_{app_name}_{user_name}_{workspace_name}
 *
 * Client-safe pure functions (zero Node.js fs/os dependencies) so they can be
 * imported safely in React client components and Node.js server routes.
 * File size strictly < 200 lines.
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
  const rawWs = (workspaceName || '').trim();
  const app = sanitizeFolderSegment(appName);
  const user = sanitizeFolderSegment(userName);

  // If user already entered the full canonical format (e.g. ultrst_srkl_dinil_production),
  // or any ultrst_ prefix, preserve it without double-prefixing
  if (rawWs.toLowerCase().startsWith('ultrst_')) {
    return sanitizeFolderSegment(rawWs);
  }

  let ws = sanitizeFolderSegment(rawWs);
  // Simplify redundant app_vault or app_workspace patterns
  if (ws === `${app}_vault` || ws === `${app}_workspace`) {
    ws = ws.replace(`${app}_`, '');
  }

  return `ultrst_${app}_${user}_${ws}`;
}

export function formatCanonicalWorkspacePath(
  appName: string = 'srkl',
  userName: string = 'user',
  workspaceName: string = 'default'
): string {
  return `./${formatCanonicalWorkspaceFolderName(appName, userName, workspaceName)}`;
}

export function getSafeCloudFolderName(name: string): string {
  return (name || 'Folder')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Folder';
}

/**
 * Cleanly extracts or derives a canonical workspace folder prefix.
 * Strips away any local filesystem prefixes (e.g. /tmp/srkl_workspace/ or /tmp/srkl/)
 * and ensures the result is a clean relative folder prefix like "ultrst_srkl_user_vault".
 */
export function extractCanonicalFolderPrefix(
  rawPathOrPrefix?: string | null,
  userName: string = 'user',
  workspaceName: string = 'default'
): string {
  if (!rawPathOrPrefix || rawPathOrPrefix.trim() === '') {
    return formatCanonicalWorkspaceFolderName('srkl', userName, workspaceName);
  }

  let clean = rawPathOrPrefix.trim().replace(/^["']|["']$/g, '');
  clean = clean.replace(/\\/g, '/'); // normalize Windows backslashes

  // If path contains segments, look for ultrst_ segment or the trailing folder name
  if (clean.includes('/')) {
    const segments = clean.split('/').filter((s) => s.length > 0 && s !== '.');
    const ultrstSegment = segments.find((s) => s.toLowerCase().startsWith('ultrst_'));
    if (ultrstSegment) {
      return sanitizeFolderSegment(ultrstSegment);
    }
    // Filter out common temp folder names
    const nonTempSegments = segments.filter(
      (s) =>
        s !== 'tmp' &&
        s !== 'var' &&
        s !== 'folders' &&
        s !== 'T' &&
        !s.startsWith('srkl_workspace') &&
        !s.startsWith('srkl_vault')
    );
    if (nonTempSegments.length > 0) {
      const last = nonTempSegments[nonTempSegments.length - 1];
      return formatCanonicalWorkspaceFolderName('srkl', userName, last);
    }
    return formatCanonicalWorkspaceFolderName('srkl', userName, workspaceName);
  }

  if (clean.toLowerCase().startsWith('ultrst_')) {
    return sanitizeFolderSegment(clean);
  }

  if (
    clean === 'srkl_vault' ||
    clean === 'srkl_workspace' ||
    clean.startsWith('/tmp') ||
    clean.startsWith('\\tmp')
  ) {
    return formatCanonicalWorkspaceFolderName('srkl', userName, workspaceName);
  }

  return formatCanonicalWorkspaceFolderName('srkl', userName, clean);
}
