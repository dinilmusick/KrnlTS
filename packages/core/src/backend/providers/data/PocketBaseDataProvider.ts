/**
 * @file PocketBaseDataProvider.ts
 * @description PocketBase REST Data Provider for collection records CRUD and filtering.
 */

import { IWorkspaceDataProvider, DatabaseProviderConfig } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

export class PocketBaseDataProvider implements IWorkspaceDataProvider {
  readonly engine = "pocketbase" as const;
  private endpoint: string;
  private apiKey?: string;
  private isConnected = false;

  constructor(config: DatabaseProviderConfig) {
    this.endpoint = (config.endpoint || "http://127.0.0.1:8090").replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = this.apiKey;
    }
    return headers;
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
      const res = await KrnlHTTP.get<any>(`${this.endpoint}/api/health`, {
        headers: this.getHeaders(),
        timeout: 5000
      });
      const latencyMs = Date.now() - t0;
      return {
        ok: res.status === "success" && (res.data?.code === 200 || res.code === 200),
        latencyMs,
        details: {
          engine: "pocketbase",
          endpoint: this.endpoint,
          data: res.data
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
    // PocketBase collections are configured via PocketBase schema or admin API.
  }

  private buildFilterParam(filter?: Record<string, any>): string {
    if (!filter || Object.keys(filter).length === 0) return "";
    const expressions: string[] = [];
    for (const [key, val] of Object.entries(filter)) {
      if (typeof val === "string") {
        expressions.push(`${key}='${val.replace(/'/g, "\\'")}'`);
      } else if (typeof val === "number" || typeof val === "boolean") {
        expressions.push(`${key}=${val}`);
      }
    }
    return expressions.length > 0 ? encodeURIComponent(expressions.join(" && ")) : "";
  }

  async find<T = any>(table: string, filter?: Record<string, any>, options?: { limit?: number; offset?: number; sort?: Record<string, 1 | -1> }): Promise<T[]> {
    const params: string[] = [];
    const filterStr = this.buildFilterParam(filter);
    if (filterStr) params.push(`filter=${filterStr}`);

    const perPage = options?.limit || 50;
    const page = options?.offset ? Math.floor(options.offset / perPage) + 1 : 1;
    params.push(`page=${page}&perPage=${perPage}`);

    if (options?.sort) {
      const sortParts = Object.entries(options.sort).map(([col, dir]) => `${dir === -1 ? "-" : "+"}${col}`);
      params.push(`sort=${encodeURIComponent(sortParts.join(","))}`);
    }

    const qs = params.length > 0 ? `?${params.join("&")}` : "";
    const url = `${this.endpoint}/api/collections/${table}/records${qs}`;
    const res = await KrnlHTTP.get<{ items: T[]; totalItems: number }>(url, { headers: this.getHeaders() });
    if (res.status === "success" && res.data?.items) {
      return res.data.items;
    }
    return [];
  }

  async findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null> {
    if (typeof filter === "string") {
      const url = `${this.endpoint}/api/collections/${table}/records/${filter}`;
      const res = await KrnlHTTP.get<T>(url, { headers: this.getHeaders() });
      return res.status === "success" && res.data ? res.data : null;
    }
    const list = await this.find<T>(table, filter, { limit: 1 });
    return list[0] || null;
  }

  async insert<T = any>(table: string, data: T | T[]): Promise<T | T[]> {
    const url = `${this.endpoint}/api/collections/${table}/records`;
    if (Array.isArray(data)) {
      const results: T[] = [];
      for (const item of data) {
        const res = await KrnlHTTP.post<T>(url, item, { headers: this.getHeaders() });
        if (res.status === "success" && res.data) results.push(res.data);
      }
      return results;
    } else {
      const res = await KrnlHTTP.post<T>(url, data, { headers: this.getHeaders() });
      return res.status === "success" && res.data ? res.data : data;
    }
  }

  async update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{ affectedRows: number }> {
    let targetId: string | null = null;
    if (typeof filter === "string") {
      targetId = filter;
    } else {
      const existing = await this.findOne<any>(table, filter);
      targetId = existing?.id || null;
    }

    if (!targetId) return { affectedRows: 0 };
    const url = `${this.endpoint}/api/collections/${table}/records/${targetId}`;
    const res = await KrnlHTTP.request<T>(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(patch)
    });
    return { affectedRows: res.status === "success" ? 1 : 0 };
  }

  async delete(table: string, filter: Record<string, any> | string): Promise<{ affectedRows: number }> {
    let targetId: string | null = null;
    if (typeof filter === "string") {
      targetId = filter;
    } else {
      const existing = await this.findOne<any>(table, filter);
      targetId = existing?.id || null;
    }

    if (!targetId) return { affectedRows: 0 };
    const url = `${this.endpoint}/api/collections/${table}/records/${targetId}`;
    const res = await KrnlHTTP.del(url, { headers: this.getHeaders() });
    return { affectedRows: res.status === "success" ? 1 : 0 };
  }

  async count(table: string, filter?: Record<string, any>): Promise<number> {
    const filterStr = this.buildFilterParam(filter);
    const qs = `?page=1&perPage=1${filterStr ? `&filter=${filterStr}` : ""}`;
    const url = `${this.endpoint}/api/collections/${table}/records${qs}`;
    const res = await KrnlHTTP.get<{ totalItems: number }>(url, { headers: this.getHeaders() });
    return res.status === "success" && typeof res.data?.totalItems === "number" ? res.data.totalItems : 0;
  }

  async clear(table: string): Promise<void> {
    const all = await this.find<any>(table);
    for (const item of all) {
      if (item.id) await this.delete(table, item.id);
    }
  }

  async query<T = any>(queryStr: string, _params?: any[]): Promise<T[]> {
    return this.find<T>(queryStr);
  }

  async execute(_commandStr: string, _params?: any[]): Promise<{ affectedRows: number }> {
    return { affectedRows: 0 };
  }
}
