/**
 * @file FirebaseStorageProvider.ts
 * @description Firebase Cloud Storage REST Provider for binary assets and public download URLs.
 */

import { IStorageProvider, StorageProviderConfig } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

export class FirebaseStorageProvider implements IStorageProvider {
  readonly driver = "firebase_storage" as const;
  private bucket: string;
  private apiKey?: string;

  constructor(config: StorageProviderConfig) {
    this.bucket = config.bucket || `${config.projectId || "default"}.appspot.com`;
    this.apiKey = config.apiKey;
  }

  private get baseUrl(): string {
    return `https://firebasestorage.googleapis.com/v0/b/${this.bucket}/o`;
  }

  async uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType = "application/octet-stream"): Promise<{ url: string; size: number }> {
    const cleanPath = encodeURIComponent(targetPath.replace(/^\/+/, ""));
    const url = `${this.baseUrl}?name=${cleanPath}${this.apiKey ? `&key=${this.apiKey}` : ""}`;

    let body: any = content;
    let size = 0;
    if (Buffer.isBuffer(content)) size = content.byteLength;
    else if (typeof content === "string") size = Buffer.byteLength(content);

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": mimeType
      },
      body
    });

    return {
      url: this.getPublicUrl(targetPath),
      size
    };
  }

  async downloadFile(targetPath: string): Promise<Buffer> {
    const cleanPath = encodeURIComponent(targetPath.replace(/^\/+/, ""));
    const url = `${this.baseUrl}/${cleanPath}?alt=media${this.apiKey ? `&key=${this.apiKey}` : ""}`;
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  async deleteFile(targetPath: string): Promise<boolean> {
    const cleanPath = encodeURIComponent(targetPath.replace(/^\/+/, ""));
    const url = `${this.baseUrl}/${cleanPath}${this.apiKey ? `&key=${this.apiKey}` : ""}`;
    const res = await KrnlHTTP.del(url);
    return res.status === "success";
  }

  getPublicUrl(targetPath: string): string {
    const cleanPath = encodeURIComponent(targetPath.replace(/^\/+/, ""));
    return `${this.baseUrl}/${cleanPath}?alt=media`;
  }

  async listFiles(_prefix = ""): Promise<Array<{ path: string; size: number; updatedAt: number }>> {
    return [];
  }
}
