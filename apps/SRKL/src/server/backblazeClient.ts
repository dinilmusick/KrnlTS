/**
 * @file backblazeClient.ts
 * @description Official REST API Client for Backblaze B2 Object Cloud Storage.
 * Handles b2_authorize_account, b2_list_buckets, file/folder operations, and versions.
 * File size < 200 lines strictly.
 */

declare const Buffer: any;

export interface B2AuthData {
  accountId: string;
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  s3ApiUrl?: string;
  allowed?: {
    bucketId?: string | null;
    bucketName?: string | null;
    buckets?: Array<{ bucketId: string; bucketName: string }>;
    capabilities?: string[];
    namePrefix?: string | null;
  };
}

export interface B2BucketItem {
  accountId: string;
  bucketId: string;
  bucketName: string;
  bucketType: 'allPublic' | 'allPrivate' | 'snapshot' | string;
  bucketInfo?: Record<string, string>;
  corsRules?: unknown[];
  lifecycleRules?: unknown[];
  revision?: number;
}

export interface B2FileItem {
  fileId: string;
  fileName: string;
  action: 'upload' | 'folder' | 'hide' | 'start';
  contentLength: number;
  contentType: string;
  contentSha1?: string;
  uploadTimestamp: number;
  fileInfo?: Record<string, string>;
}

export class BackblazeClient {
  public static async authorize(keyId: string, applicationKey: string): Promise<B2AuthData> {
    const credsB64 = Buffer.from(`${keyId.trim()}:${applicationKey.trim()}`).toString('base64');
    let res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'GET',
      headers: { Authorization: `Basic ${credsB64}`, 'User-Agent': 'SRKL-Hub-B2/1.0' },
    });

    if (!res.ok) {
      res = await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account', {
        method: 'GET',
        headers: { Authorization: `Basic ${credsB64}`, 'User-Agent': 'SRKL-Hub-B2/1.0' },
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Backblaze authorization failed (${res.status})`;
      try { errMsg = JSON.parse(errText).message || errMsg; } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    const apiUrl = (data.apiInfo?.storageApi?.apiUrl || data.apiUrl || 'https://api.backblazeb2.com').replace(/\/+$/, '');
    const downloadUrl = (data.apiInfo?.storageApi?.downloadUrl || data.downloadUrl || apiUrl).replace(/\/+$/, '');

    return {
      accountId: data.accountId,
      authorizationToken: data.authorizationToken,
      apiUrl,
      downloadUrl,
      s3ApiUrl: data.apiInfo?.storageApi?.s3ApiUrl || data.s3ApiUrl,
      allowed: data.apiInfo?.storageApi?.allowed || data.allowed,
    };
  }

  private static async postJson(auth: B2AuthData, endpoint: string, body: Record<string, unknown>): Promise<any> {
    const baseApiUrl = (auth.apiUrl || 'https://api.backblazeb2.com').replace(/\/+$/, '');
    const res = await fetch(`${baseApiUrl}/b2api/v2/${endpoint}`, {
      method: 'POST',
      headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.code || `B2 API request failed (${endpoint}: ${res.status})`);
    }
    return res.json();
  }

  public static async listBuckets(auth: B2AuthData, bucketId?: string): Promise<B2BucketItem[]> {
    const body: Record<string, unknown> = { accountId: auth.accountId };
    const restrictedBucketId = bucketId || auth.allowed?.bucketId || auth.allowed?.buckets?.[0]?.bucketId;
    const restrictedBucketName = auth.allowed?.bucketName || auth.allowed?.buckets?.[0]?.bucketName;
    if (restrictedBucketId) body.bucketId = restrictedBucketId;
    else if (restrictedBucketName) body.bucketName = restrictedBucketName;

    const data = await this.postJson(auth, 'b2_list_buckets', body);
    return data.buckets || [];
  }

  public static async createBucket(auth: B2AuthData, bucketName: string, bucketType: 'allPublic' | 'allPrivate' = 'allPrivate'): Promise<B2BucketItem> {
    return await this.postJson(auth, 'b2_create_bucket', { accountId: auth.accountId, bucketName, bucketType });
  }

  public static async deleteBucket(auth: B2AuthData, bucketId: string): Promise<boolean> {
    await this.postJson(auth, 'b2_delete_bucket', { accountId: auth.accountId, bucketId });
    return true;
  }

  public static async listFileNames(
    auth: B2AuthData,
    bucketId: string,
    prefix = '',
    delimiter?: string,
    maxFileCount = 1000,
    startFileName?: string
  ): Promise<{ files: B2FileItem[]; nextFileName: string | null }> {
    const payload: Record<string, unknown> = { bucketId, maxFileCount, prefix: prefix || '' };
    if (delimiter) payload.delimiter = delimiter;
    if (startFileName) payload.startFileName = startFileName;

    const data = await this.postJson(auth, 'b2_list_file_names', payload);
    return { files: data.files || [], nextFileName: data.nextFileName || null };
  }

  public static async listFileVersions(
    auth: B2AuthData,
    bucketId: string,
    prefix = '',
    maxFileCount = 1000,
    startFileName?: string,
    startFileId?: string
  ): Promise<{ files: B2FileItem[]; nextFileName: string | null; nextFileId: string | null }> {
    const payload: Record<string, unknown> = { bucketId, maxFileCount, prefix: prefix || '' };
    if (startFileName) payload.startFileName = startFileName;
    if (startFileId) payload.startFileId = startFileId;

    const data = await this.postJson(auth, 'b2_list_file_versions', payload);
    return { files: data.files || [], nextFileName: data.nextFileName || null, nextFileId: data.nextFileId || null };
  }

  public static async getUploadUrl(auth: B2AuthData, bucketId: string): Promise<{ uploadUrl: string; authorizationToken: string }> {
    return await this.postJson(auth, 'b2_get_upload_url', { bucketId });
  }

  public static async uploadFile(
    uploadUrl: string,
    uploadAuthToken: string,
    fileName: string,
    buffer: any | Uint8Array,
    contentType = 'b2/x-auto',
    sha1 = 'do_not_verify'
  ): Promise<B2FileItem> {
    const encodedFileName = encodeURIComponent(fileName).replace(/%2F/g, '/');
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: uploadAuthToken,
        'X-Bz-File-Name': encodedFileName,
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'X-Bz-Content-Sha1': sha1,
      },
      body: buffer,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.code || 'Failed to upload file to Backblaze');
    }
    return await res.json();
  }

  public static async deleteFileVersion(auth: B2AuthData, fileName: string, fileId: string): Promise<boolean> {
    await this.postJson(auth, 'b2_delete_file_version', { fileName, fileId });
    return true;
  }

  public static async getDownloadAuthorization(auth: B2AuthData, bucketId: string, validDuration = 86400): Promise<string> {
    try {
      const data = await this.postJson(auth, 'b2_get_download_authorization', { bucketId, fileNamePrefix: '', validDurationInSeconds: validDuration });
      return data.authorizationToken || auth.authorizationToken;
    } catch {
      return auth.authorizationToken;
    }
  }
}


