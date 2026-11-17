/**
 * @file b2DirectCore.ts
 * @description Direct REST API Client for Backblaze B2 Object Storage in Qwnsr.
 * Zero-dependency, pure web-standard fetch. Runs on Node, Vercel, and Cloudflare Workers.
 */

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
  };
}

const authCache = new Map<string, { auth: B2AuthData; expiresAt: number }>();
const bucketIdCache = new Map<string, string>();

export async function authorizeB2(keyId: string, applicationKey: string): Promise<B2AuthData> {
  const normalizedKeyId = keyId.trim();
  const normalizedApplicationKey = applicationKey.trim();
  if (!normalizedKeyId || !normalizedApplicationKey) {
    throw new Error('B2 credentials are required.');
  }
  const cacheKey = `${normalizedKeyId}:${normalizedApplicationKey}`;
  const cached = authCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.auth;

  const authHeader = btoa(`${normalizedKeyId}:${normalizedApplicationKey}`);
  let res: Response;
  try {
    res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { Authorization: `Basic ${authHeader}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      res = await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account', {
        headers: { Authorization: `Basic ${authHeader}` },
        signal: AbortSignal.timeout(10000),
      });
    }
  } catch {
    throw new Error('Backblaze B2 authorization failed before receiving a response.');
  }
  if (!res.ok) throw new Error(`Backblaze B2 authorization failed with HTTP ${res.status}.`);

  const data: any = await res.json();
  const apiUrl = data.apiInfo?.storageApi?.apiUrl || data.apiUrl;
  const downloadUrl = data.apiInfo?.storageApi?.downloadUrl || data.downloadUrl || apiUrl;
  if (
    typeof data.accountId !== 'string'
    || !data.accountId
    || typeof data.authorizationToken !== 'string'
    || !data.authorizationToken
    || typeof apiUrl !== 'string'
    || typeof downloadUrl !== 'string'
  ) {
    throw new Error('Backblaze B2 authorization returned an invalid response.');
  }

  const auth: B2AuthData = {
    accountId: data.accountId,
    authorizationToken: data.authorizationToken,
    apiUrl: apiUrl.replace(/\/+$/, ''),
    downloadUrl: downloadUrl.replace(/\/+$/, ''),
    s3ApiUrl: data.apiInfo?.storageApi?.s3ApiUrl || data.s3ApiUrl,
    allowed: data.apiInfo?.storageApi?.allowed || data.allowed,
  };

  authCache.set(cacheKey, { auth, expiresAt: Date.now() + 20 * 60 * 1000 });
  return auth;
}

export async function b2ListBuckets(keyId: string, applicationKey: string, bucketId?: string, bucketName?: string) {
  const auth = await authorizeB2(keyId, applicationKey);
  const allowed = auth.allowed;

  // Restricted application keys are authoritative only when the B2
  // authorization response identifies the actual permitted bucket.
  if (allowed?.bucketId || allowed?.bucketName || Array.isArray(allowed?.buckets)) {
    const candidates = Array.isArray(allowed.buckets)
      ? allowed.buckets
      : allowed.bucketId && allowed.bucketName
        ? [{ bucketId: allowed.bucketId, bucketName: allowed.bucketName }]
        : [];
    return candidates.filter((bucket) =>
      (!bucketId || bucket.bucketId === bucketId)
      && (!bucketName || bucket.bucketName === bucketName)
      && typeof bucket.bucketId === 'string'
      && Boolean(bucket.bucketId)
      && typeof bucket.bucketName === 'string'
      && Boolean(bucket.bucketName),
    );
  }

  let response: Response;
  try {
    response = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: auth.accountId }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error('Backblaze B2 bucket discovery failed before receiving a response.');
  }
  if (!response.ok) {
    throw new Error(`Backblaze B2 bucket discovery failed with HTTP ${response.status}.`);
  }
  const data: any = await response.json();
  if (!Array.isArray(data.buckets)) {
    throw new Error('Backblaze B2 bucket discovery returned an invalid response.');
  }
  return data.buckets;
}

export async function getB2BucketId(keyId: string, applicationKey: string, bucketName: string): Promise<string> {
  const cacheKey = `${keyId.trim()}:${applicationKey.trim()}:${bucketName.trim()}`;
  if (bucketIdCache.has(cacheKey)) return bucketIdCache.get(cacheKey)!;

  const buckets = await b2ListBuckets(keyId, applicationKey, undefined, bucketName);
  const match = buckets.find((b: any) => b.bucketName === bucketName);
  if (!match) throw new Error(`B2 bucket "${bucketName}" not found in account`);

  bucketIdCache.set(cacheKey, match.bucketId);
  return match.bucketId;
}

export async function b2UploadFile(keyId: string, applicationKey: string, bucketName: string, fileName: string, buffer: Uint8Array, contentType = 'b2/x-auto') {
  const auth = await authorizeB2(keyId, applicationKey);
  const bucketId = await getB2BucketId(keyId, applicationKey, bucketName);
  const urlRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId }),
  });
  if (!urlRes.ok) throw new Error(`B2 upload URL request failed with HTTP ${urlRes.status}.`);
  const { uploadUrl, authorizationToken } = (await urlRes.json()) as any;

  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(buffer);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  const sha1 = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const encodedFileName = encodeURIComponent(fileName).replace(/%2F/g, '/');
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: authorizationToken,
      'X-Bz-File-Name': encodedFileName,
      'Content-Type': contentType,
      'X-Bz-Content-Sha1': sha1,
    },
    body: bytes,
  });
  if (!uploadRes.ok) throw new Error(`B2 upload failed with HTTP ${uploadRes.status}.`);
  return uploadRes.json();
}

export async function b2DownloadFile(keyId: string, applicationKey: string, bucketName: string, fileName: string): Promise<Uint8Array | null> {
  const auth = await authorizeB2(keyId, applicationKey);
  const encodedName = encodeURIComponent(fileName).replace(/%2F/g, '/');
  const res = await fetch(`${auth.downloadUrl}/file/${bucketName}/${encodedName}`, { headers: { Authorization: auth.authorizationToken } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`B2 file download failed with HTTP ${res.status}.`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function b2ListFileNames(keyId: string, applicationKey: string, bucketName: string, prefix = '') {
  const auth = await authorizeB2(keyId, applicationKey);
  const bucketId = await getB2BucketId(keyId, applicationKey, bucketName);
  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
    method: 'POST',
    headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId, prefix, maxFileCount: 1000 }),
  });
  if (!res.ok) throw new Error(`B2 file listing failed with HTTP ${res.status}.`);
  const data: any = await res.json();
  if (!Array.isArray(data.files)) throw new Error('B2 file listing returned an invalid response.');
  return data.files as Array<{ fileName: string; fileId: string; contentLength: number; uploadTimestamp: number }>;
}

export async function b2DeleteFileVersion(keyId: string, applicationKey: string, fileName: string, fileId: string) {
  const auth = await authorizeB2(keyId, applicationKey);
  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
    method: 'POST',
    headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileId }),
  });
  if (!res.ok) throw new Error(`B2 delete file version failed (${res.status})`);
  return res.json();
}

export async function b2DeleteFolder(keyId: string, applicationKey: string, bucketName: string, folderPrefix: string) {
  const cleanPrefix = folderPrefix.replace(/\/+$/, '') + '/';
  const files = await b2ListFileNames(keyId, applicationKey, bucketName, cleanPrefix);
  let deletedCount = 0;
  for (const file of files) {
    await b2DeleteFileVersion(keyId, applicationKey, file.fileName, file.fileId);
    deletedCount++;
  }
  return { success: true, deletedCount };
}
