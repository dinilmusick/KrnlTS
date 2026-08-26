/**
 * @file FirebaseDataProvider.ts
 * @description Firebase Firestore REST Data Provider for document collections CRUD.
 */

import { IWorkspaceDataProvider, DatabaseProviderConfig } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

export class FirebaseDataProvider implements IWorkspaceDataProvider {
  readonly engine = "firebase" as const;
  private projectId: string;
  private apiKey?: string;
  private isConnected = false;

  constructor(config: DatabaseProviderConfig) {
    this.projectId = config.projectId || "";
    this.apiKey = config.apiKey;
  }

  private get baseUrl(): string {
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  private get urlSuffix(): string {
    return this.apiKey ? `?key=${this.apiKey}` : "";
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
      const url = `${this.baseUrl}${this.urlSuffix}`;
      const res = await KrnlHTTP.get<any>(url, { timeout: 5000 });
      const latencyMs = Date.now() - t0;
      return {
        ok: res.status === "success" || res.code === 200 || res.code === 404,
        latencyMs,
        details: {
          engine: "firebase",
          projectId: this.projectId,
          status: res.status
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
    // Firestore collections are schemaless and auto-created on first write.
  }

  /**
   * Translates plain JavaScript object into Firestore document value structure
   */
  private toFirestoreFields(obj: Record<string, any>): Record<string, any> {
    const fields: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      fields[key] = this.toFirestoreValue(val);
    }
    return fields;
  }

  private toFirestoreValue(val: any): any {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === "boolean") return { booleanValue: val };
    if (typeof val === "number") {
      return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    }
    if (typeof val === "string") return { stringValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(v => this.toFirestoreValue(v)) } };
    }
    if (typeof val === "object") {
      return { mapValue: { fields: this.toFirestoreFields(val) } };
    }
    return { stringValue: String(val) };
  }

  /**
   * Translates Firestore document into standard JavaScript object
   */
  private fromFirestoreDoc(doc: any): any {
    if (!doc || !doc.fields) return null;
    const result: Record<string, any> = {};
    const docName = doc.name || "";
    const id = docName.split("/").pop();
    if (id) result.id = id;

    for (const [key, fieldObj] of Object.entries(doc.fields as Record<string, any>)) {
      result[key] = this.fromFirestoreValue(fieldObj);
    }
    return result;
  }

  private fromFirestoreValue(fieldObj: any): any {
    if (!fieldObj || typeof fieldObj !== "object") return null;
    if ("stringValue" in fieldObj) return fieldObj.stringValue;
    if ("integerValue" in fieldObj) return parseInt(fieldObj.integerValue, 10);
    if ("doubleValue" in fieldObj) return fieldObj.doubleValue;
    if ("booleanValue" in fieldObj) return fieldObj.booleanValue;
    if ("nullValue" in fieldObj) return null;
    if ("arrayValue" in fieldObj) {
      return (fieldObj.arrayValue.values || []).map((v: any) => this.fromFirestoreValue(v));
    }
    if ("mapValue" in fieldObj) {
      const obj: Record<string, any> = {};
      for (const [k, v] of Object.entries(fieldObj.mapValue.fields || {})) {
        obj[k] = this.fromFirestoreValue(v);
      }
      return obj;
    }
    return null;
  }

  async find<T = any>(table: string, filter?: Record<string, any>, options?: { limit?: number; offset?: number }): Promise<T[]> {
    const url = `${this.baseUrl}/${table}${this.urlSuffix}`;
    const res = await KrnlHTTP.get<{ documents?: any[] }>(url);
    if (res.status === "success" && Array.isArray(res.data?.documents)) {
      let items = res.data!.documents.map(d => this.fromFirestoreDoc(d)).filter(Boolean);
      if (filter && Object.keys(filter).length > 0) {
        items = items.filter(item => {
          for (const [k, v] of Object.entries(filter)) {
            if (item[k] !== v) return false;
          }
          return true;
        });
      }
      if (options?.offset) items = items.slice(options.offset);
      if (options?.limit) items = items.slice(0, options.limit);
      return items as T[];
    }
    return [];
  }

  async findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null> {
    if (typeof filter === "string") {
      const url = `${this.baseUrl}/${table}/${filter}${this.urlSuffix}`;
      const res = await KrnlHTTP.get<any>(url);
      return res.status === "success" && res.data ? this.fromFirestoreDoc(res.data) : null;
    }
    const list = await this.find<T>(table, filter, { limit: 1 });
    return list[0] || null;
  }

  async insert<T = any>(table: string, data: T | T[]): Promise<T | T[]> {
    const items = Array.isArray(data) ? data : [data];
    const results: any[] = [];

    for (const item of items) {
      const docObj = { ...(item as any) };
      const docId = docObj.id || docObj._id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      delete docObj.id;
      delete docObj._id;

      const url = `${this.baseUrl}/${table}?documentId=${docId}${this.apiKey ? `&key=${this.apiKey}` : ""}`;
      const body = { fields: this.toFirestoreFields(docObj) };
      const res = await KrnlHTTP.post<any>(url, body);
      if (res.status === "success" && res.data) {
        results.push(this.fromFirestoreDoc(res.data));
      } else {
        results.push({ id: docId, ...docObj });
      }
    }

    return Array.isArray(data) ? (results as T[]) : (results[0] as T);
  }

  async update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{ affectedRows: number }> {
    let docId: string | null = null;
    if (typeof filter === "string") {
      docId = filter;
    } else {
      const existing = await this.findOne<any>(table, filter);
      docId = existing?.id || null;
    }

    if (!docId) return { affectedRows: 0 };
    const patchFields = this.toFirestoreFields(patch as any);
    const updateMask = Object.keys(patch)
      .map(k => `updateMask.fieldPaths=${k}`)
      .join("&");
    const url = `${this.baseUrl}/${table}/${docId}?${updateMask}${this.apiKey ? `&key=${this.apiKey}` : ""}`;
    const res = await KrnlHTTP.request<any>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: patchFields })
    });
    return { affectedRows: res.status === "success" ? 1 : 0 };
  }

  async delete(table: string, filter: Record<string, any> | string): Promise<{ affectedRows: number }> {
    let docId: string | null = null;
    if (typeof filter === "string") {
      docId = filter;
    } else {
      const existing = await this.findOne<any>(table, filter);
      docId = existing?.id || null;
    }

    if (!docId) return { affectedRows: 0 };
    const url = `${this.baseUrl}/${table}/${docId}${this.urlSuffix}`;
    const res = await KrnlHTTP.del(url);
    return { affectedRows: res.status === "success" ? 1 : 0 };
  }

  async count(table: string, filter?: Record<string, any>): Promise<number> {
    const list = await this.find(table, filter);
    return list.length;
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
