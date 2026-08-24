/**
 * @file SupabaseDataProvider.ts
 * @description Supabase PostgREST Data Provider with latency ping and REST CRUD operations.
 */

import { IWorkspaceDataProvider, DatabaseProviderConfig } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

export class SupabaseDataProvider implements IWorkspaceDataProvider {
  readonly engine = "supabase" as const;
  private endpoint: string;
  private apiKey: string;
  private isConnected = false;

  constructor(config: DatabaseProviderConfig) {
    this.endpoint = (config.endpoint || "").replace(/\/+$/, "");
    this.apiKey = config.apiKey || "";
  }

  private getHeaders(): Record<string, string> {
    return {
      "apikey": this.apiKey,
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  async connect(): Promise<void> {
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; details?: any }> {
    const t0 = Date.now();
    try {
      const res = await KrnlHTTP.get<any>(`${this.endpoint}/rest/v1/`, {
        headers: this.getHeaders(),
        timeout: 5000
      });
      const latencyMs = Date.now() - t0;
      return {
        ok: res.status === "success" || res.code === 200 || res.code === 404,
        latencyMs,
        details: {
          engine: "supabase",
          endpoint: this.endpoint,
          status: res.status,
          code: res.code
        }
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        details: { error: err.message }
      };
    }
  }

  async ensureTable(_tableName: string, _schema?: Record<string, any>): Promise<void> {
    // Supabase tables are managed via schema migrations or PostgreSQL DDL.
  }

  private buildQueryString(filter?: Record<string, any>, options?: { limit?: number; offset?: number; sort?: Record<string, 1 | -1> }): string {
    const params: string[] = [];

    if (filter) {
      for (const [key, val] of Object.entries(filter)) {
        if (val === null || val === undefined) {
          params.push(`${key}=is.null`);
        } else if (typeof val === "object") {
          if ("$gt" in val) params.push(`${key}=gt.${encodeURIComponent(val.$gt)}`);
          if ("$gte" in val) params.push(`${key}=gte.${encodeURIComponent(val.$gte)}`);
          if ("$lt" in val) params.push(`${key}=lt.${encodeURIComponent(val.$lt)}`);
          if ("$lte" in val) params.push(`${key}=lte.${encodeURIComponent(val.$lte)}`);
          if ("$ne" in val) params.push(`${key}=neq.${encodeURIComponent(val.$ne)}`);
        } else {
          params.push(`${key}=eq.${encodeURIComponent(String(val))}`);
        }
      }
    }

    if (options?.limit) {
      params.push(`limit=${options.limit}`);
    }
    if (options?.offset) {
      params.push(`offset=${options.offset}`);
    }
    if (options?.sort) {
      const order = Object.entries(options.sort)
        .map(([col, dir]) => `${col}.${dir === 1 ? "asc" : "desc"}`)
        .join(",");
      params.push(`order=${order}`);
    }

    return params.length > 0 ? `?${params.join("&")}` : "";
  }

  async find<T = any>(table: string, filter?: Record<string, any>, options?: { limit?: number; offset?: number; sort?: Record<string, 1 | -1> }): Promise<T[]> {
    const qs = this.buildQueryString(filter, options);
    const url = `${this.endpoint}/rest/v1/${table}${qs}`;
    const res = await KrnlHTTP.get<T[]>(url, { headers: this.getHeaders() });
    if (res.status === "success" && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  async findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null> {
    const filterObj = typeof filter === "string" ? { id: filter } : filter;
    const list = await this.find<T>(table, filterObj, { limit: 1 });
    return list[0] || null;
  }

  async insert<T = any>(table: string, data: T | T[]): Promise<T | T[]> {
    const url = `${this.endpoint}/rest/v1/${table}`;
    const res = await KrnlHTTP.post<T[]>(url, data, { headers: this.getHeaders() });
    if (res.status === "success" && res.data) {
      return Array.isArray(data) ? res.data : res.data[0];
    }
    return data;
  }

  async update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{ affectedRows: number }> {
    const filterObj = typeof filter === "string" ? { id: filter } : filter;
    const qs = this.buildQueryString(filterObj);
    const url = `${this.endpoint}/rest/v1/${table}${qs}`;
    const res = await KrnlHTTP.request<any[]>(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(patch)
    });
    const affected = res.status === "success" && Array.isArray(res.data) ? res.data.length : 0;
    return { affectedRows: affected };
  }

  async delete(table: string, filter: Record<string, any> | string): Promise<{ affectedRows: number }> {
    const filterObj = typeof filter === "string" ? { id: filter } : filter;
    const qs = this.buildQueryString(filterObj);
    const url = `${this.endpoint}/rest/v1/${table}${qs}`;
    const res = await KrnlHTTP.del<any[]>(url, { headers: this.getHeaders() });
    const affected = res.status === "success" && Array.isArray(res.data) ? res.data.length : 0;
    return { affectedRows: affected };
  }

  async count(table: string, filter?: Record<string, any>): Promise<number> {
    const qs = this.buildQueryString(filter);
    const url = `${this.endpoint}/rest/v1/${table}${qs}`;
    const headers = { ...this.getHeaders(), "Prefer": "count=exact", "Range-Unit": "items", "Range": "0-0" };
    const res = await KrnlHTTP.get<any[]>(url, { headers });
    return res.status === "success" && Array.isArray(res.data) ? res.data.length : 0;
  }

  async clear(table: string): Promise<void> {
    await this.delete(table, {});
  }

  async query<T = any>(queryStr: string, _params?: any[]): Promise<T[]> {
    return this.find<T>(queryStr);
  }

  async execute(_commandStr: string, _params?: any[]): Promise<{ affectedRows: number }> {
    return { affectedRows: 0 };
  }
}
