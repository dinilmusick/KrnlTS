/**
 * @file backblazeApi.ts
 * @description Frontend API client contacting real Backblaze B2 service endpoints.
 * Emits real-time service events to BackblazeEventBus on mutations.
 * File size < 200 lines strictly.
 */

import { BackblazeBucket, BackblazeItem } from '../types/backblazeTypes';
import { BackblazeEventBus } from '@/libraries/services/backblaze/BackblazeEventBus';

export async function fetchLiveBuckets(creds: Record<string, unknown>): Promise<BackblazeBucket[]> {
  const keyId = typeof creds['keyId'] === 'string' ? creds['keyId'].trim() : '';
  const applicationKey = typeof creds['applicationKey'] === 'string' ? creds['applicationKey'].trim() : '';
  if (!keyId || !applicationKey) throw new Error('Backblaze credentials (Key ID and Application Key) are missing.');

  const res = await fetch('/api/backblaze/buckets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId, applicationKey }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to contact Backblaze service.');

  return (json.buckets || []).map((b: any) => ({
    id: b.bucketId,
    name: b.bucketName,
    type: b.bucketType,
    region: b.bucketInfo?.region || (creds['region'] as string) || 'us-west-002',
    revision: b.revision,
  }));
}

export async function createLiveBucket(creds: Record<string, unknown>, bucketName: string, bucketType: 'allPublic' | 'allPrivate'): Promise<BackblazeBucket> {
  const res = await fetch('/api/backblaze/create-bucket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId: creds['keyId'], applicationKey: creds['applicationKey'], bucketName, bucketType }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create bucket in Backblaze.');
  const bucket: BackblazeBucket = { id: json.bucket.bucketId, name: json.bucket.bucketName, type: json.bucket.bucketType };
  BackblazeEventBus.emit({ type: 'b2:bucket:created', bucketId: bucket.id, bucketName: bucket.name });
  return bucket;
}

export async function deleteLiveBucket(creds: Record<string, unknown>, bucketId: string): Promise<void> {
  const res = await fetch('/api/backblaze/delete-bucket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId: creds['keyId'], applicationKey: creds['applicationKey'], bucketId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete bucket from Backblaze.');
  BackblazeEventBus.emit({ type: 'b2:bucket:deleted', bucketId });
}

export async function fetchLiveBucketFiles(
  creds: Record<string, unknown>,
  bucketId: string,
  bucketName: string,
  prefix = ''
): Promise<{ items: BackblazeItem[]; downloadUrl: string; downloadAuthToken: string }> {
  const res = await fetch('/api/backblaze/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyId: creds['keyId'],
      applicationKey: creds['applicationKey'],
      bucketId,
      maxFileCount: 1000,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to list bucket contents from Backblaze.');

  const downloadUrl = json.downloadUrl || '';
  const downloadAuthToken = json.downloadAuthToken || '';
  const rawFiles: any[] = json.files || [];

  const items: BackblazeItem[] = rawFiles
    .filter((f) => f.action !== 'hide')
    .map((f) => {
      const isFolder = f.action === 'folder' || f.fileName.endsWith('/');
      const cleanPath = f.fileName.endsWith('/') ? f.fileName.slice(0, -1) : f.fileName;
      const parts = cleanPath.split('/');
      const name = parts[parts.length - 1] || cleanPath;
      const proxyUrl = `/api/backblaze/proxy-file?keyId=${encodeURIComponent(creds['keyId'] as string)}&applicationKey=${encodeURIComponent(creds['applicationKey'] as string)}&bucketName=${encodeURIComponent(bucketName)}&fileName=${encodeURIComponent(f.fileName)}`;

      return {
        id: f.fileId || `folder-${cleanPath}`,
        fileId: f.fileId,
        name,
        path: cleanPath,
        type: isFolder ? ('folder' as const) : ('file' as const),
        sizeBytes: f.contentLength,
        contentType: f.contentType,
        sha1: f.contentSha1,
        uploadTimestamp: f.uploadTimestamp,
        updatedAt: f.uploadTimestamp ? new Date(f.uploadTimestamp).toISOString().replace('T', ' ').substring(0, 16) : undefined,
        downloadUrl: `${downloadUrl}/file/${bucketName}/${encodeURIComponent(f.fileName)}?Authorization=${downloadAuthToken}`,
        previewUrl: proxyUrl,
      };
    });

  return { items, downloadUrl, downloadAuthToken };
}

export async function uploadLiveFile(
  creds: Record<string, unknown>,
  bucketId: string,
  fileName: string,
  file: File
): Promise<BackblazeItem> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const fileBase64 = btoa(binary);

  const res = await fetch('/api/backblaze/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyId: creds['keyId'],
      applicationKey: creds['applicationKey'],
      bucketId,
      fileName,
      fileBase64,
      contentType: file.type || 'b2/x-auto',
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to upload file to Backblaze.');
  const f = json.file;
  const item: BackblazeItem = {
    id: f.fileId,
    fileId: f.fileId,
    name: file.name,
    path: fileName,
    type: 'file',
    sizeBytes: file.size,
    contentType: file.type || f.contentType,
    sha1: f.contentSha1,
    uploadTimestamp: f.uploadTimestamp,
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };
  BackblazeEventBus.emit({ type: 'b2:object:created', bucketId, path: fileName, fileId: f.fileId, sizeBytes: file.size });
  return item;
}

export async function createLiveFolder(
  creds: Record<string, unknown>,
  bucketId: string,
  folderPath: string
): Promise<void> {
  const res = await fetch('/api/backblaze/create-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyId: creds['keyId'],
      applicationKey: creds['applicationKey'],
      bucketId,
      folderPath,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create folder in Backblaze.');
  BackblazeEventBus.emit({ type: 'b2:object:created', bucketId, path: folderPath });
}

export async function deleteLiveFile(creds: Record<string, unknown>, fileName: string, fileId?: string, bucketId?: string): Promise<void> {
  const res = await fetch('/api/backblaze/delete-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId: creds['keyId'], applicationKey: creds['applicationKey'], fileName, fileId, bucketId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete file from Backblaze.');
  BackblazeEventBus.emit({ type: 'b2:object:deleted', bucketId, path: fileName, fileId });
}

export async function deleteLiveFolder(creds: Record<string, unknown>, folderPath: string, bucketId: string): Promise<void> {
  const res = await fetch('/api/backblaze/delete-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId: creds['keyId'], applicationKey: creds['applicationKey'], bucketId, folderPath }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete folder from Backblaze.');
  BackblazeEventBus.emit({ type: 'b2:object:deleted', bucketId, path: folderPath });
}
