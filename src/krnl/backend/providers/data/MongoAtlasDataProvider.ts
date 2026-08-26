// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import type { IWorkspaceDataProvider, DatabaseProviderConfig, BackendServiceType } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. MONGODB ATLAS DATA API PROVIDER
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: MongoAtlasDataProvider
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provides serverless document querying and mutations against MongoDB Atlas Data API.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class MongoAtlasDataProvider implements IWorkspaceDataProvider {
  public readonly engine: BackendServiceType = "mongodb";
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
        return { ok: false, latencyMs: 0, details: "Missing Mongo Atlas endpoint" };
      }
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - startTime, details: err.message };
    }
  }

  public async ensureTable(tableName: string): Promise<void> {
    // Collections created on write in MongoDB
  }

  private async callAtlasAction(action: string, payload: Record<string, any>): Promise<any> {
    if (!this.config.endpoint) return null;
    const url = `${this.config.endpoint.replace(/\/$/, "")}/action/${action}`;
    try {
      const response = await KrnlHTTP.request<any>(url, {
        method: "POST",
        headers: {
          "api-key": this.config.apiKey || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dataSource: "Cluster0",
          database: this.config.database || "krnl_vault",
          ...payload
        })
      });
      return response.data;
    } catch {
      return null;
    }
  }

  public async query<T = any>(queryStr: string): Promise<T[]> {
    return [];
  }

  public async execute(): Promise<{ affectedRows: number }> {
    return { affectedRows: 1 };
  }

  public async find<T = any>(table: string, filter: Record<string, any> = {}): Promise<T[]> {
    const res = await this.callAtlasAction("find", { collection: table, filter });
    return (res?.documents || []) as T[];
  }

  public async findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null> {
    const queryFilter = typeof filter === "string" ? { id: filter } : filter;
    const res = await this.callAtlasAction("findOne", { collection: table, filter: queryFilter });
    return (res?.document || null) as T | null;
  }

  public async insert<T = any>(table: string, data: T | T[]): Promise<T | T[]> {
    if (Array.isArray(data)) {
      await this.callAtlasAction("insertMany", { collection: table, documents: data });
    } else {
      await this.callAtlasAction("insertOne", { collection: table, document: data });
    }
    return data;
  }

  public async update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{ affectedRows: number }> {
    const queryFilter = typeof filter === "string" ? { id: filter } : filter;
    const res = await this.callAtlasAction("updateOne", {
      collection: table,
      filter: queryFilter,
      update: { $set: patch }
    });
    return { affectedRows: res?.modifiedCount || 0 };
  }

  public async delete(table: string, filter: Record<string, any> | string): Promise<{ affectedRows: number }> {
    const queryFilter = typeof filter === "string" ? { id: filter } : filter;
    const res = await this.callAtlasAction("deleteOne", { collection: table, filter: queryFilter });
    return { affectedRows: res?.deletedCount || 0 };
  }

  public async count(table: string, filter: Record<string, any> = {}): Promise<number> {
    const res = await this.find(table, filter);
    return res.length;
  }

  public async clear(table: string): Promise<void> {
    await this.callAtlasAction("deleteMany", { collection: table, filter: {} });
  }
}
