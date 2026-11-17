/**
 * @file backblazeCore.ts
 * @description Universal Backblaze B2 Storage Core.
 * Runs on Node.js, Express, Vercel, and Cloudflare Workers via Web Standard Fetch.
 * Conforms to Skipo Governance (< 200 lines).
 */

import { BackblazeClient, B2AuthData, B2BucketItem, B2FileItem } from '../../../server/backblazeClient';

declare const Buffer: any;

const authCache = new Map<string, { auth: B2AuthData; timestamp: number }>();

export async function getOrAuthorizeB2(keyId: string, applicationKey: string): Promise<B2AuthData> {
  const cacheKey = `${keyId.trim()}:${applicationKey.trim()}`;
  const cached = authCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 20 * 60 * 1000) {
    return cached.auth;
  }
  const auth = await BackblazeClient.authorize(keyId, applicationKey);
  authCache.set(cacheKey, { auth, timestamp: Date.now() });
  return auth;
}

export function invalidateB2Cache(keyId: string, applicationKey: string): void {
  authCache.delete(`${keyId.trim()}:${applicationKey.trim()}`);
}

export async function listB2Buckets(
  keyId: string,
  applicationKey: string,
  bucketId?: string
): Promise<{ success: boolean; buckets?: B2BucketItem[]; error?: string }> {
  try {
    let auth = await getOrAuthorizeB2(keyId, applicationKey);
    try {
      const buckets = await BackblazeClient.listBuckets(auth, bucketId);
      return { success: true, buckets };
    } catch {
      invalidateB2Cache(keyId, applicationKey);
      auth = await BackblazeClient.authorize(keyId, applicationKey);
      const buckets = await BackblazeClient.listBuckets(auth, bucketId);
      return { success: true, buckets };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to list buckets' };
  }
}

export async function listB2Files(
  keyId: string,
  applicationKey: string,
  bucketId: string,
  prefix = '',
  delimiter?: string,
  maxFileCount = 1000
): Promise<{ success: boolean; files?: B2FileItem[]; downloadUrl?: string; downloadAuthToken?: string; error?: string }> {
  try {
    let auth = await getOrAuthorizeB2(keyId, applicationKey);
    let allFiles: B2FileItem[] = [];
    const fetchBatch = async (authorization: B2AuthData) => {
      let filesAcc: B2FileItem[] = [];
      let start: string | undefined = undefined;
      while (true) {
        const result = await BackblazeClient.listFileNames(authorization, bucketId, prefix, delimiter, maxFileCount, start);
        filesAcc = filesAcc.concat(result.files || []);
        if (!result.nextFileName || result.nextFileName === start) break;
        start = result.nextFileName;
      }
      return filesAcc;
    };

    try {
      allFiles = await fetchBatch(auth);
    } catch {
      invalidateB2Cache(keyId, applicationKey);
      auth = await BackblazeClient.authorize(keyId, applicationKey);
      allFiles = await fetchBatch(auth);
    }

    const downloadAuthToken = await BackblazeClient.getDownloadAuthorization(auth, bucketId);
    return {
      success: true,
      files: allFiles,
      downloadUrl: auth.downloadUrl,
      downloadAuthToken,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to list files' };
  }
}

export async function createB2Bucket(
  keyId: string,
  applicationKey: string,
  bucketName: string,
  bucketType: 'allPublic' | 'allPrivate' = 'allPrivate'
): Promise<{ success: boolean; bucket?: B2BucketItem; error?: string }> {
  try {
    const auth = await getOrAuthorizeB2(keyId, applicationKey);
    const bucket = await BackblazeClient.createBucket(auth, bucketName, bucketType);
    return { success: true, bucket };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create bucket' };
  }
}

export async function deleteB2Bucket(
  keyId: string,
  applicationKey: string,
  bucketId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getOrAuthorizeB2(keyId, applicationKey);
    await BackblazeClient.deleteBucket(auth, bucketId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete bucket' };
  }
}

export async function uploadB2File(
  keyId: string,
  applicationKey: string,
  bucketId: string,
  fileName: string,
  fileBase64: string,
  contentType = 'b2/x-auto',
  sha1 = 'do_not_verify'
): Promise<{ success: boolean; file?: B2FileItem; error?: string }> {
  try {
    const auth = await getOrAuthorizeB2(keyId, applicationKey);
    const { uploadUrl, authorizationToken } = await BackblazeClient.getUploadUrl(auth, bucketId);
    const buffer = Buffer.from(fileBase64, 'base64');
    const file = await BackblazeClient.uploadFile(uploadUrl, authorizationToken, fileName, buffer, contentType, sha1);
    return { success: true, file };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to upload file' };
  }
}

export async function deleteB2FileVersion(
  keyId: string,
  applicationKey: string,
  fileName: string,
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getOrAuthorizeB2(keyId, applicationKey);
    await BackblazeClient.deleteFileVersion(auth, fileName, fileId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete file version' };
  }
}
