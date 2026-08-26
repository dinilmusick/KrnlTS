/**
 * @file PocketBaseStorageProvider.ts
 * @description PocketBase Storage Provider for file uploads and downloads.
 */

import { IStorageProvider, StorageProviderConfig } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

export class PocketBaseStorageProvider implements IStorageProvider {
  readonly driver = "pocketbase_storage" as const;
  private endpoint: string;
  private bucket: string;

  constructor(config: StorageProviderConfig) {
    this.endpoint = (config.endpoint || "http://127.0.0.1:8090").replace(/\/+$/, "");
    this.bucket = config.bucket || "files";
  }

  async uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType = "application/octet-stream"): Promise<{ url: string; size: number }> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/api/collections/${this.bucket}/records`;

    let size = 0;
    if (Buffer.isBuffer(content)) size = content.byteLength;
    else if (typeof content === "string") size = Buffer.byteLength(content);

    const formData = new FormData();
    const blob = new Blob([content as any], { type: mimeType });
    formData.append("file", blob, cleanPath);

    await fetch(url, {
      method: "POST",
      body: formData
    });

    return {
      url: this.getPublicUrl(cleanPath),
      size
    };
  }

  async downloadFile(targetPath: string): Promise<Buffer> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/api/files/${this.bucket}/${cleanPath}`;
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  async deleteFile(targetPath: string): Promise<boolean> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/api/collections/${this.bucket}/records/${cleanPath}`;
    const res = await KrnlHTTP.del(url);
    return res.status === "success";
  }

  getPublicUrl(targetPath: string): string {
    const cleanPath = targetPath.replace(/^\/+/, "");
    return `${this.endpoint}/api/files/${this.bucket}/${cleanPath}`;
  }

  async listFiles(_prefix = ""): Promise<Array<{ path: string; size: number; updatedAt: number }>> {
    return [];
  }
}
