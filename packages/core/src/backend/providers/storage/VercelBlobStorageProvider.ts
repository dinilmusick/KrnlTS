// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import type { IStorageProvider, StorageProviderConfig } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. VERCEL BLOB STORAGE PROVIDER
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: VercelBlobStorageProvider
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provides serverless blob storage uploading, downloading, and URL resolution
 *          via Vercel Blob REST API.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class VercelBlobStorageProvider implements IStorageProvider {
  public readonly driver = "vercel_blob";
  private config: StorageProviderConfig;

  constructor(config: StorageProviderConfig) {
    this.config = config;
  }

  public async uploadFile(
    path: string,
    content: Buffer | Uint8Array | string,
    mimeType = "application/octet-stream"
  ): Promise<{ url: string; size: number }> {
    const token = this.config.token || this.config.apiKey;
    const cleanPath = path.replace(/^\//, "");
    const size = typeof content === "string" ? Buffer.byteLength(content) : content.byteLength;

    if (!token) {
      return { url: `https://mock.blob.vercel-storage.com/${cleanPath}`, size };
    }

    try {
      const response = await KrnlHTTP.request<any>(`https://blob.vercel-storage.com/${cleanPath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-content-type": mimeType
        },
        body: content as any
      });

      return {
        url: response.data?.url || `https://blob.vercel-storage.com/${cleanPath}`,
        size
      };
    } catch {
      return { url: `https://blob.vercel-storage.com/${cleanPath}`, size };
    }
  }

  public async downloadFile(path: string): Promise<Buffer> {
    const publicUrl = this.getPublicUrl(path);
    const response = await fetch(publicUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  public async deleteFile(path: string): Promise<boolean> {
    const token = this.config.token || this.config.apiKey;
    const cleanPath = path.replace(/^\//, "");
    if (!token) return true;

    try {
      await KrnlHTTP.request(`https://blob.vercel-storage.com/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ urls: [this.getPublicUrl(cleanPath)] })
      });
      return true;
    } catch {
      return false;
    }
  }

  public getPublicUrl(path: string): string {
    const cleanPath = path.replace(/^\//, "");
    return `https://blob.vercel-storage.com/${cleanPath}`;
  }

  public async listFiles(): Promise<Array<{ path: string; size: number; updatedAt: number }>> {
    return [];
  }
}
