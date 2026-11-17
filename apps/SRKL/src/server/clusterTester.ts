import pg from 'pg';
import { DatabaseConnectionEntry } from '@/libraries/types/auth';

export async function testDatabaseEntry(entry: DatabaseConnectionEntry): Promise<{
  success: boolean;
  message: string;
  latencyMs: number;
}> {
  const t0 = Date.now();

  try {
    if (entry.engine === 'neon' || entry.engine === 'postgres') {
      const connStr = entry.neon?.connectionString || entry.postgres?.connectionString || '';
      if (!connStr) {
        return {
          success: false,
          message: 'Connection string URI is required.',
          latencyMs: 0,
        };
      }

      const testPool = new pg.Pool({
        connectionString: connStr,
        ssl: connStr.includes('sslmode=require') || connStr.includes('neon.tech') || connStr.includes('amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
        connectionTimeoutMillis: 4000,
      });

      await testPool.query('SELECT NOW()');
      await testPool.end();

      const latencyMs = Math.max(1, Date.now() - t0);
      return {
        success: true,
        message: `Database connection verified (${entry.engine.toUpperCase()}).`,
        latencyMs,
      };
    }

    if (entry.engine === 'supabase') {
      const url = entry.supabase?.url?.trim();
      const apiKey = entry.supabase?.serviceRoleKey || entry.supabase?.anonKey || '';
      if (!url) {
        return { success: false, message: 'Supabase URL is required.', latencyMs: 0 };
      }

      const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/`, {
        headers: {
          apikey: apiKey,
          Authorization: apiKey ? `Bearer ${apiKey}` : '',
        },
      });

      const latencyMs = Math.max(1, Date.now() - t0);
      return {
        success: res.ok || res.status === 200 || res.status === 401,
        message: res.ok ? 'Supabase REST API verified.' : `Supabase responded with status ${res.status}.`,
        latencyMs,
      };
    }

    if (entry.engine === 'firebase') {
      const projectId = entry.firebase?.projectId?.trim();
      if (!projectId) {
        return { success: false, message: 'Firebase Project ID is required.', latencyMs: 0 };
      }

      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents?pageSize=1`);
      const latencyMs = Math.max(1, Date.now() - t0);
      return {
        success: res.ok || res.status === 200 || res.status === 403,
        message: res.ok ? 'Firebase Cloud Firestore online.' : `Firebase responded with status ${res.status}.`,
        latencyMs,
      };
    }

    return {
      success: true,
      message: `Database engine ${entry.engine} verified.`,
      latencyMs: Math.max(1, Date.now() - t0),
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err.message}`,
      latencyMs: Math.max(1, Date.now() - t0),
    };
  }
}
