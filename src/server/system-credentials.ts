import { getDatabaseUrl, query } from './db';

export interface UltrstCredentials {
  id: string;
  credentials?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const credentialsCache = new Map<string, { value: UltrstCredentials; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

/**
 * Compatibility surface retained for existing SRKL imports.
 * SYSTEM_DATABASE_URL is primary; the Kloks resolver considers _2/_3 only
 * when the primary is absent. SRKL does not treat them as cluster replicas.
 */
export function getSystemDatabaseUrls(): string[] {
  const primary = getDatabaseUrl();
  return primary ? [primary] : [];
}

export async function autoProvisionCredentialsTable(
  connectionString: string,
): Promise<{ success: boolean; message: string }> {
  const canonical = getDatabaseUrl();
  if (!canonical) throw new Error('SYSTEM_DATABASE_URL is not configured.');
  if (!connectionString?.trim()) throw new Error('Canonical system database URL is required.');

  await query(`
    CREATE TABLE IF NOT EXISTS public."ultrst-credentials" (
      id TEXT PRIMARY KEY,
      credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    ALTER TABLE public."ultrst-credentials"
    ADD COLUMN IF NOT EXISTS credentials JSONB NOT NULL DEFAULT '{}'::jsonb
  `);
  await query(`
    INSERT INTO public."ultrst-credentials" (id, credentials)
    VALUES ('system', '{}'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `);
  return { success: true, message: 'ultrst-credentials table provisioned through Kloks DatabaseService' };
}

export async function getSystemCredentials(
  targetId = 'system',
  forceRefresh = false,
): Promise<UltrstCredentials | null> {
  const now = Date.now();
  const cached = credentialsCache.get(targetId);
  if (!forceRefresh && cached && now < cached.expiresAt) return cached.value;

  const connectionString = getDatabaseUrl();
  if (!connectionString) return { id: targetId, credentials: {} };
  await autoProvisionCredentialsTable(connectionString);

  const result = await query(
    'SELECT id, credentials, created_at, updated_at FROM public."ultrst-credentials" WHERE id = $1 LIMIT 1',
    [targetId],
  );
  const row = result.rows?.[0];
  if (!row) {
    const empty = { id: targetId, credentials: {} };
    credentialsCache.set(targetId, { value: empty, expiresAt: now + CACHE_TTL_MS });
    return empty;
  }

  const raw = row.credentials;
  const credentials = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
  const parsed: UltrstCredentials = {
    id: String(row.id || targetId),
    credentials,
    ...(row.created_at ? { created_at: new Date(row.created_at).toISOString() } : {}),
    ...(row.updated_at ? { updated_at: new Date(row.updated_at).toISOString() } : {}),
  };
  credentialsCache.set(targetId, { value: parsed, expiresAt: now + CACHE_TTL_MS });
  return parsed;
}

export async function saveSystemCredentials(
  updates: Partial<UltrstCredentials>,
  targetId = 'system',
): Promise<UltrstCredentials> {
  const connectionString = getDatabaseUrl();
  if (!connectionString) throw new Error('SYSTEM_DATABASE_URL is not configured.');
  await autoProvisionCredentialsTable(connectionString);

  const current = (await getSystemCredentials(targetId, true)) || { id: targetId, credentials: {} };
  const merged: UltrstCredentials = {
    ...current,
    ...updates,
    id: targetId,
    credentials: updates.credentials ?? current.credentials ?? {},
    updated_at: new Date().toISOString(),
  };
  await query(
    `INSERT INTO public."ultrst-credentials" (id, credentials, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET
       credentials = EXCLUDED.credentials,
       updated_at = NOW()`,
    [merged.id, JSON.stringify(merged.credentials || {})],
  );
  credentialsCache.set(targetId, { value: merged, expiresAt: Date.now() + CACHE_TTL_MS });
  return merged;
}

export function clearSystemCredentialsCache(targetId?: string): void {
  if (targetId) credentialsCache.delete(targetId);
  else credentialsCache.clear();
}
