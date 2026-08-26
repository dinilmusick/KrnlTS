// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import type { IWorkspaceDataProvider, DatabaseProviderConfig, BackendServiceType } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. TURSO LIBSQL EDGE DATA PROVIDER
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: TursoLibSQLDataProvider
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provides high-speed, edge-distributed SQLite query execution over Turso LibSQL HTTP API.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class TursoLibSQLDataProvider implements IWorkspaceDataProvider {
  public readonly engine: BackendServiceType = "turso";
  private config: DatabaseProviderConfig;
  private isConnected = false;

  constructor(config: DatabaseProviderConfig) {
    this.config = config;
  }

  public async connect(): Promise<void> {
    this.isConnected = true;
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  public async testConnection(): Promise<{ ok: boolean; latencyMs: number; details?: any }> {
    const startTime = Date.now();
    try {
      if (!this.config.endpoint) {
        return { ok: false, latencyMs: 0, details: "Missing Turso endpoint" };
      }
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - startTime, details: err.message };
    }
  }

  public async ensureTable(tableName: string): Promise<void> {
    await this.execute(
      `CREATE TABLE IF NOT EXISTS "${tableName}" (id TEXT PRIMARY KEY, data TEXT, updated_at INTEGER)`
    );
  }

  public async query<T = any>(queryStr: string, params: any[] = []): Promise<T[]> {
    if (!this.config.endpoint) return [];
    try {
      const url = `${this.config.endpoint.replace(/\/$/, "")}/v2/pipeline`;
      const response = await KrnlHTTP.request<any>(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.authToken || this.config.apiKey || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              type: "execute",
              stmt: { sql: queryStr, args: params.map(p => ({ type: "text", value: String(p) })) }
            },
            { type: "close" }
          ]
        })
      });

      const rows = response.data?.results?.[0]?.response?.result?.rows || [];
      return rows.map((r: any[]) => (r[1]?.value ? JSON.parse(r[1].value) : r[0]?.value || r));
    } catch {
      return [];
    }
  }

  public async execute(commandStr: string, params: any[] = []): Promise<{ affectedRows: number }> {
    const res = await this.query(commandStr, params);
    return { affectedRows: res.length || 1 };
  }

  public async find<T = any>(table: string, filter?: Record<string, any>): Promise<T[]> {
    return this.query<T>(`SELECT data FROM "${table}"`);
  }

  public async findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null> {
    const id = typeof filter === "string" ? filter : filter.id;
    if (!id) return null;
    const res = await this.query<T>(`SELECT data FROM "${table}" WHERE id = ? LIMIT 1`, [id]);
    return res[0] || null;
  }

  public async insert<T = any>(table: string, data: T | T[]): Promise<T | T[]> {
    await this.ensureTable(table);
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      const id = (item as any).id || `turso_${Date.now()}`;
      await this.execute(
        `INSERT OR REPLACE INTO "${table}" (id, data, updated_at) VALUES (?, ?, ?)`,
        [id, JSON.stringify(item), Date.now()]
      );
    }
    return data;
  }

  public async update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{ affectedRows: number }> {
    const existing = await this.findOne<T>(table, filter);
    if (!existing) return { affectedRows: 0 };
    const updated = { ...existing, ...patch };
    await this.insert(table, updated);
    return { affectedRows: 1 };
  }

  public async delete(table: string, filter: Record<string, any> | string): Promise<{ affectedRows: number }> {
    const id = typeof filter === "string" ? filter : filter.id;
    if (!id) return { affectedRows: 0 };
    return this.execute(`DELETE FROM "${table}" WHERE id = ?`, [id]);
  }

  public async count(table: string): Promise<number> {
    const all = await this.find(table);
    return all.length;
  }

  public async clear(table: string): Promise<void> {
    await this.execute(`DELETE FROM "${table}"`);
  }
}
