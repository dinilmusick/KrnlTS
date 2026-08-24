/**
 * @file S3StorageProvider.ts
 * @description S3-Compatible Storage Provider supporting AWS S3, MinIO, and Cloudflare R2.
 */

import { IStorageProvider, StorageProviderConfig } from "../../types.js";
import { KrnlHTTP } from "../../../tools/KrnlHTTP.js";

export class S3StorageProvider implements IStorageProvider {
  readonly driver = "s3" as const;
  private endpoint: string;
  private bucket: string;
  private region: string;
  private accessKey?: string;
  private secretKey?: string;

  constructor(config: StorageProviderConfig) {
    this.bucket = config.bucket || "default-bucket";
    this.region = config.region || "us-east-1";
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.endpoint = config.endpoint
      ? config.endpoint.replace(/\/+$/, "")
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
  }

  private getBaseUrl(): string {
    return this.endpoint.includes(this.bucket)
      ? this.endpoint
      : `${this.endpoint}/${this.bucket}`;
  }

  async uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType = "application/octet-stream"): Promise<{ url: string; size: number }> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.getBaseUrl()}/${cleanPath}`;

    let body: any = content;
    let size = 0;
    if (Buffer.isBuffer(content)) {
      size = content.byteLength;
    } else if (typeof content === "string") {
      size = Buffer.byteLength(content);
    }

    await KrnlHTTP.request(url, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType
      },
      body
    });

    return {
      url: this.getPublicUrl(cleanPath),
      size
    };
  }

  async downloadFile(targetPath: string): Promise<Buffer> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.getBaseUrl()}/${cleanPath}`;
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  async deleteFile(targetPath: string): Promise<boolean> {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.getBaseUrl()}/${cleanPath}`;
    const res = await KrnlHTTP.del(url);
    return res.status === "success";
  }

  getPublicUrl(targetPath: string): string {
    const cleanPath = targetPath.replace(/^\/+/, "");
    return `${this.getBaseUrl()}/${cleanPath}`;
  }

  async listFiles(_prefix = ""): Promise<Array<{ path: string; size: number; updatedAt: number }>> {
    return [];
  }
}
