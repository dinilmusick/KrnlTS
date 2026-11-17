/**
 * Lossless compatibility update for the legacy SRKL local-folder metadata.
 * Cloud connection records are preserved exactly as stored (including their
 * encrypted secret envelope); never pass hydrated server-side connections here.
 */
export function upsertLegacyLocalStorageConnection(
  profiles: Record<string, any>,
  rawConnection: Record<string, any>,
  isFirstOwnedConnection: boolean,
  now = new Date().toISOString(),
): { profiles: Record<string, any>; connection: Record<string, any> } {
  const srkl = profiles?.srkl && typeof profiles.srkl === 'object' ? profiles.srkl : {};
  const stored = Array.isArray(srkl.storage_connections) ? srkl.storage_connections : [];
  const id = typeof rawConnection.id === 'string' && rawConnection.id.trim()
    ? rawConnection.id.trim()
    : `conn_local_${Date.now()}`;
  const existing = stored.find((item: any) =>
    item && item.provider === 'local_fs' && item.id === id,
  );
  const connection = {
    id,
    provider: 'local_fs',
    label: String(rawConnection.label || existing?.label || 'Local Folder'),
    role: isFirstOwnedConnection ? 'primary' : (existing?.role || 'redundant_clone'),
    enabled: true,
    ...(typeof rawConnection.localFolderName === 'string' ? { localFolderName: rawConnection.localFolderName } : {}),
    ...(typeof rawConnection.localFolderKey === 'string' ? { localFolderKey: rawConnection.localFolderKey } : {}),
    ...(typeof rawConnection.localFolderPathHint === 'string' ? { localFolderPathHint: rawConnection.localFolderPathHint } : {}),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const storage_connections = [
    ...stored.filter((item: any) => !(item && item.provider === 'local_fs' && item.id === id)),
    connection,
  ];
  return {
    profiles: { ...profiles, srkl: { ...srkl, storage_connections } },
    connection,
  };
}

/**
 * Merge legacy profile metadata with Kloks-owned connections without mutating
 * either source. A canonical record wins when the opaque IDs match; otherwise
 * legacy records remain available for lossless compatibility/migration.
 */
export function mergeLegacyStorageConnections<T extends { id?: unknown; provider?: unknown }>(
  canonicalConnections: T[],
  legacyConnections: T[],
): T[] {
  const canonicalIds = new Set(canonicalConnections.map((connection) => String(connection.id || '')).filter(Boolean));
  const seenLegacyIds = new Set<string>();
  return legacyConnections.filter((connection) => {
    if (!connection || typeof connection !== 'object' || typeof connection.provider !== 'string') return false;
    const id = String(connection.id || '').trim();
    if (!id || canonicalIds.has(id) || seenLegacyIds.has(id)) return false;
    seenLegacyIds.add(id);
    return true;
  });
}
