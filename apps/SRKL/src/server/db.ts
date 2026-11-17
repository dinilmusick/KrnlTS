import 'dotenv/config';
import { DatabaseServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { tryResolveSystemDatabaseUrl } from '@ultrst-armada/kloks/backend/resolver';

let isConnected = false;
let dbError: string | null = null;

export function getDatabasePool(): null {
  // Compatibility shim for older imports. Query execution is owned by Kloks'
  // cross-runtime DatabaseService, not an SRKL-specific pg pool.
  return null;
}

export function getDatabaseUrl(): string | null {
  try {
    return tryResolveSystemDatabaseUrl(process.env as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** @deprecated Use the shared Kloks DatabaseService. Kept for import compatibility. */
export function initDbPool(): null {
  if (!getDatabaseUrl()) {
    dbError = 'SYSTEM_DATABASE_URL is not configured (SYSTEM_DATABASE_URL_2/_3 are optional fallbacks).';
    isConnected = false;
  }
  return null;
}

export async function query(text: string, params?: any[]): Promise<any> {
  if (!getDatabaseUrl()) {
    dbError = 'SYSTEM_DATABASE_URL is not configured (SYSTEM_DATABASE_URL_2/_3 are optional fallbacks).';
    isConnected = false;
    throw new Error(dbError);
  }
  try {
    const result = await DatabaseServiceFacade.execute('query', {
      sql: text,
      params: params || [],
      env: process.env as Record<string, unknown>,
    });
    isConnected = true;
    dbError = null;
    return result;
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Shared system database query failed.';
    isConnected = false;
    throw error;
  }
}

export function getDbStatus() {
  const configuredUrl = getDatabaseUrl();
  return {
    connected: isConnected && Boolean(configuredUrl),
    error: dbError,
    configured: Boolean(configuredUrl),
    url: configuredUrl ? configuredUrl.replace(/:[^:@\\u000a]+@/, ':********@') : null,
  };
}

export async function cleanupLegacySrklTables(): Promise<void> {
  try {
    // 1. Migrate orphaned SRKL profile data from srkl_users into srkl_application_profiles
    await query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'srkl_users') THEN
          INSERT INTO "srkl_application_profiles" (id, email, username, name, role, avatar_glyph, app_profiles, created_at, updated_at)
          SELECT id, email, username, name, role, avatar_glyph, COALESCE(app_profiles, '{}'::jsonb), created_at, updated_at
          FROM srkl_users
          ON CONFLICT (email) DO NOTHING;
        END IF;
      END $$;
    `).catch(() => {});

    // 2. Drop all legacy tables to enforce System Database Purity
    await query(`DROP TABLE IF EXISTS srkl_audit_logs, srkl_cluster_databases, system_buckets CASCADE;`).catch(() => {});
    console.log('[SystemDB] Legacy tables cleanup verified: only ecosystem tables preserved.');
  } catch (err: any) {
    console.warn('[SystemDB] Legacy cleanup warning:', err.message);
  }
}

export async function bootstrapDatabase(): Promise<void> {
  const connectionString = getDatabaseUrl();
  if (!connectionString) return;

  try {
    // SRKL-owned application profiles. Credentials and sessions remain exclusively in Luth.
    await query(`
      CREATE TABLE IF NOT EXISTS "srkl_application_profiles" (
        id VARCHAR(255) PRIMARY KEY, email VARCHAR(255) NOT NULL,
        username VARCHAR(128) NOT NULL, name VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'user', avatar_glyph VARCHAR(8) DEFAULT '👤',
        app_profiles JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS srkl_application_profiles_email_idx
        ON "srkl_application_profiles" (LOWER(email));
    `);

    // Ecosystem Apps Registry Table ("ultrst-apps")
    await query(`
      CREATE TABLE IF NOT EXISTS "ultrst-apps" (
        id VARCHAR(64) PRIMARY KEY,
        app_id VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        supported_services JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Deployments Registry Table ("ultrst-srkl-deployments")
    await query(`
      CREATE TABLE IF NOT EXISTS "ultrst-srkl-deployments" (
        id VARCHAR(120) PRIMARY KEY, label VARCHAR(255) NOT NULL, url TEXT NOT NULL UNIQUE,
        priority INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, is_primary BOOLEAN DEFAULT false,
        environment VARCHAR(32) DEFAULT 'production',
        notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS ultrst_srkl_deployments_active_idx ON "ultrst-srkl-deployments" (is_active, priority DESC, is_primary DESC);
    `);

    const { autoProvisionCredentialsTable } = await import('./system-credentials');
    const { autoProvisionSystemBucketsTable } = await import('./system-buckets-table');
    await autoProvisionCredentialsTable(connectionString);
    await autoProvisionSystemBucketsTable(connectionString);

    // One-time profile migration; the shared identity table is not used at runtime.
    await query(`
      DO $
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'ultrst-users') THEN
          INSERT INTO "srkl_application_profiles"
            (id, email, username, name, role, avatar_glyph, app_profiles, created_at, last_login_at, updated_at)
          SELECT id, email, username, name, COALESCE(role, 'user'), avatar_glyph,
                 COALESCE(app_profiles, '{}'::jsonb), created_at, last_login_at, updated_at
          FROM "ultrst-users" ON CONFLICT (id) DO NOTHING;
        END IF;
      END $;
    `);

    // Seed initial ecosystem apps if not existing
    await query(`
      INSERT INTO "ultrst-apps" (id, app_id, name, description, supported_services, status) VALUES
        ('app-depm-001', 'depm', 'DEPM Deployment Manager', 'Deployment orchestrator', '["vercel", "github", "backblaze_b2", "cloudflare_r2", "aws_s3"]'::jsonb, 'active'),
        ('app-aiko-001', 'aiko', 'Aiko AI Router', 'AI gateway', '["openrouter", "google_ai", "anthropic", "openai", "groq", "ollama"]'::jsonb, 'active'),
        ('app-kloks-001', 'kloks', 'Kloks Shared Services', 'Shared client services', '["*"]'::jsonb, 'active'),
        ('app-srkl-001', 'srkl', 'SRKL Account Authority', 'Account authority', '["*"]'::jsonb, 'active')
      ON CONFLICT (app_id) DO NOTHING;
    `).catch(() => {});

    // Clean up any legacy srkl tables to maintain strict ecosystem purity
    await cleanupLegacySrklTables();

    // Retire the pre-vault profile account field. Service accounts are stored
    // only in the visible, workspace-scoped encrypted vault.
    try {
      const userRows = await query(`SELECT id, app_profiles FROM "srkl_application_profiles" WHERE app_profiles IS NOT NULL`);
      for (const r of (userRows?.rows || [])) {
        const p = typeof r.app_profiles === 'string' ? JSON.parse(r.app_profiles) : r.app_profiles;
        let modified = false;
        if (p?.srkl && Object.hasOwn(p.srkl, 'services')) {
          delete p.srkl.services;
          modified = true;
        }
        if (p?.srkl?.storage_connections?.length) {
          const { deduplicateConnections, ensurePrimaryRole } = await import('./storage/workspaceStorageController');
          const cleanConns = ensurePrimaryRole(deduplicateConnections(p.srkl.storage_connections));
          const primary = cleanConns.find((c) => c.role === 'primary');
          modified = modified || cleanConns.length !== p.srkl.storage_connections.length;
          if (primary && p.srkl.workspaces?.[0] && !p.srkl.workspaces[0].storageConnectionId) {
            p.srkl.workspaces[0].storageConnectionId = primary.id;
            p.srkl.workspaces[0].storageProvider = primary.provider;
            modified = true;
          }
          if (modified) p.srkl.storage_connections = cleanConns;
        }
        if (modified) await query(`UPDATE "srkl_application_profiles" SET app_profiles = $1 WHERE id = $2`, [JSON.stringify(p), r.id]);
      }
    } catch {}
    console.log('Database tables successfully bootstrapped (SRKL application profiles active).');
  } catch (err: any) {
    console.error('Failed to bootstrap database tables:', err.message);
    dbError = `Bootstrap failed: ${err.message}`;
  }
}
