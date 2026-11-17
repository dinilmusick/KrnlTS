import { neon } from '@neondatabase/serverless';
import { getSystemDatabaseUrls } from './system-credentials';

export interface SystemBucketEntry {
  id: string;
  label?: string;
  provider: string;
  bucket_name: string;
  endpoint?: string;
  region?: string;
  access_key_id?: string;
  secret_access_key?: string;
  public_url?: string;
  is_primary: boolean;
  priority?: number;
  created_at?: string;
  updated_at?: string;
}

let cachedPrimaryBucket: SystemBucketEntry | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60_000;

export async function autoProvisionSystemBucketsTable(connectionString: string): Promise<void> {
  const rawConn = connectionString?.trim().replace(/^["']|["']$/g, '');
  if (!rawConn) return;
  const sql: any = neon(rawConn);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public."ultrst-system-buckets" (
      id TEXT PRIMARY KEY,
      label TEXT,
      provider TEXT DEFAULT 's3',
      bucket_name TEXT NOT NULL,
      endpoint TEXT,
      region TEXT DEFAULT 'us-east-1',
      access_key_id TEXT,
      secret_access_key TEXT,
      public_url TEXT,
      is_primary BOOLEAN DEFAULT false,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const existing = await sql.query(
    `SELECT id FROM public."ultrst-system-buckets" WHERE is_primary = true LIMIT 1;`
  );
  if (!existing || existing.length === 0) {
    await sql.query(`
      INSERT INTO public."ultrst-system-buckets" (
        id, label, provider, bucket_name, endpoint, region,
        access_key_id, secret_access_key, public_url, is_primary, priority
      ) VALUES (
        'bkt_primary_01', 'Primary System Bucket', 's3', 'ultrst-system-bucket',
        'https://s3.us-east-1.amazonaws.com', 'us-east-1',
        '', '', '', true, 1
      ) ON CONFLICT (id) DO NOTHING;
    `);
  }
}

export async function getPrimarySystemBucket(forceRefresh = false): Promise<SystemBucketEntry | null> {
  const now = Date.now();
  if (!forceRefresh && cachedPrimaryBucket && now < cacheExpiry) {
    return cachedPrimaryBucket;
  }

  const urls = getSystemDatabaseUrls();
  for (const connStr of urls) {
    try {
      const sql: any = neon(connStr);
      await autoProvisionSystemBucketsTable(connStr);
      const rows: any[] = await sql.query(
        `SELECT * FROM public."ultrst-system-buckets" ORDER BY is_primary DESC, priority DESC, created_at ASC LIMIT 1;`
      );
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const entry: SystemBucketEntry = {
          id: row.id,
          label: row.label,
          provider: row.provider || 's3',
          bucket_name: row.bucket_name,
          endpoint: row.endpoint,
          region: row.region || 'us-east-1',
          access_key_id: row.access_key_id || '',
          secret_access_key: row.secret_access_key || '',
          public_url: row.public_url,
          is_primary: Boolean(row.is_primary),
          priority: Number(row.priority) || 0,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
        cachedPrimaryBucket = entry;
        cacheExpiry = now + CACHE_TTL_MS;
        return entry;
      }
    } catch {
      continue;
    }
  }

  return cachedPrimaryBucket || {
    id: 'bkt_primary_01',
    label: 'Primary System Bucket',
    provider: 's3',
    bucket_name: 'ultrst-system-bucket',
    region: 'us-east-1',
    is_primary: true,
  };
}

export async function getSystemBucketRows(): Promise<SystemBucketEntry[]> {
  const urls = getSystemDatabaseUrls();
  for (const connStr of urls) {
    try {
      const sql: any = neon(connStr);
      await autoProvisionSystemBucketsTable(connStr);
      const rows: any[] = await sql.query(
        `SELECT * FROM public."ultrst-system-buckets" ORDER BY is_primary DESC, priority DESC, created_at ASC;`
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((row) => ({
          id: row.id,
          label: row.label,
          provider: row.provider || 's3',
          bucket_name: row.bucket_name,
          endpoint: row.endpoint,
          region: row.region || 'us-east-1',
          access_key_id: row.access_key_id || '',
          secret_access_key: row.secret_access_key || '',
          public_url: row.public_url,
          is_primary: Boolean(row.is_primary),
          priority: Number(row.priority) || 0,
        }));
      }
    } catch {
      continue;
    }
  }
  return cachedPrimaryBucket ? [cachedPrimaryBucket] : [];
}
