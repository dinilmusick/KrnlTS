/**
 * @file SupabaseStorageProvider.ts
 * @description Supabase Storage Provider for bucket-based file uploads and asset URLs.
 */

import { IStorageProvider, StorageProviderConfig } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

export class SupabaseStorageProvider implements IStorageProvider {
  readonly driver = "supabase_storage" as const;
  private endpoint: string;
  private apiKey: string;
  private bucket: string;

  constructor(config: StorageProviderConfig) {
    this.endpoint = (config.endpoint || "").replace(/\/+$/, "");
    this.apiKey = config.apiKey || "";
    this.bucket = config.bucket || "default";
  }

  private getHeaders(mimeType?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "apikey": this.apiKey,
      "Authorization": `Bearer ${this.apiKey}`
    };
    if (mimeType) {
      headers["Content-Type"] = mimeType;
    }
    return headers;
  }

  async uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType = "application/octet-stream"): Promise<{ url: string; size: number }> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/storage/v1/object/${this.bucket}/${cleanPath}`;

    let body: any = content;
    let size = 0;
    if (Buffer.isBuffer(content)) {
      size = content.byteLength;
    } else if (typeof content === "string") {
      size = Buffer.byteLength(content);
    }

    await KrnlHTTP.request(url, {
      method: "POST",
      headers: this.getHeaders(mimeType),
      body
    });

    return {
      url: this.getPublicUrl(cleanPath),
      size
    };
  }

  async downloadFile(targetPath: string): Promise<Buffer> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/storage/v1/object/authenticated/${this.bucket}/${cleanPath}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  async deleteFile(targetPath: string): Promise<boolean> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/storage/v1/object/${this.bucket}/${cleanPath}`;
    const res = await KrnlHTTP.del(url, { headers: this.getHeaders() });
    return res.status === "success";
  }

  getPublicUrl(targetPath: string): string {
    const cleanPath = targetPath.replace(/^\/+/, "");
    return `${this.endpoint}/storage/v1/object/public/${this.bucket}/${cleanPath}`;
  }

  async listFiles(prefix = ""): Promise<Array<{ path: string; size: number; updatedAt: number }>> {
    const url = `${this.endpoint}/storage/v1/object/list/${this.bucket}`;
    const res = await KrnlHTTP.post<any[]>(url, { prefix, limit: 100 }, { headers: this.getHeaders("application/json") });
    if (res.status === "success" && Array.isArray(res.data)) {
      return res.data.map(item => ({
        path: item.name,
        size: item.metadata?.size || 0,
        updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : Date.now()
      }));
    }
    return [];
  }
}
