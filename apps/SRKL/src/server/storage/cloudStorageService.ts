/**
 * @file cloudStorageService.ts
 * @description SRKL vault storage orchestration.
 *
 * Backblaze B2 and Google Drive operations are delegated to Kloks' canonical
 * storage registry and Fetch-based provider adapters. SRKL retains only the
 * legacy S3/R2 adapter path needed for those separate provider types.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { UserStorageConnection } from '@/libraries/types/auth';

function getCanonicalOwner(conn: UserStorageConnection): string {
  const userId = String((conn as any).__ownerUserId || '').trim();
  if (!userId) throw new Error('Storage operation requires its verified connection owner.');
  return userId;
}

function isCanonicalProvider(conn: UserStorageConnection): boolean {
  return conn.provider === 'backblaze_b2' || conn.provider === 'google_drive';
}

function canonicalInput(
  conn: UserStorageConnection,
  folderPrefix: string,
  extra: Record<string, unknown> = {},
) {
  return {
    userId: getCanonicalOwner(conn),
    connectionId: conn.id,
    folderPrefix,
    ...(conn.provider === 'backblaze_b2'
      ? { bucketName: conn.b2BucketName || conn.bucketName }
      : { rootFolderId: conn.googleRootFolderId }),
    ...extra,
    env: process.env as Record<string, unknown>,
  };
}

export function resolveS3Config(conn: UserStorageConnection): {
  endpoint: string;
  region: string;
  credentials: { accessKeyId: string; secretAccessKey: string };
  bucketName: string;
} {
  if (conn.provider === 'backblaze_b2' || conn.provider === 'google_drive') {
    throw new Error(`Provider "${conn.provider}" is managed by the canonical Kloks storage service.`);
  }
  const isR2 = conn.provider === 'cloudflare_r2';
  let endpoint = (conn.endpoint || '').trim();
  let region = (conn.region || 'us-east-1').trim();
  const bucketName = (conn.bucketName || conn.r2BucketName || conn.s3BucketName || '').trim();

  if (isR2 && conn.r2AccountId) {
    endpoint = `https://${conn.r2AccountId}.r2.cloudflarestorage.com`;
    region = 'auto';
  }

  const accessKeyId = conn.accessKeyId || conn.r2AccessKeyId || conn.s3AccessKeyId || '';
  const secretAccessKey = conn.secretAccessKey || conn.r2SecretAccessKey || conn.s3SecretAccessKey || '';
  return { endpoint, region, credentials: { accessKeyId, secretAccessKey }, bucketName };
}

export function buildS3Client(conn: UserStorageConnection): { s3: S3Client; bucketName: string } {
  const cfg = resolveS3Config(conn);
  return {
    s3: new S3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      credentials: cfg.credentials,
      forcePathStyle: true,
    }),
    bucketName: cfg.bucketName,
  };
}

function buildKey(folderPrefix: string, relativePath: string): string {
  const prefix = folderPrefix.replace(/^\/+|\/+$/g, '');
  if (!relativePath || relativePath === '/' || relativePath === '') return `${prefix}/`;
  return `${prefix}/${relativePath.replace(/^\/+/g, '')}`;
}

export async function testStorageConnection(
  conn: UserStorageConnection,
): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  const started = Date.now();
  try {
    if (conn.provider === 'local_fs') return { success: true, latencyMs: 2 };
    if (conn.provider === 'backblaze_b2') {
      const userId = getCanonicalOwner(conn);
      const buckets = await StorageServiceFacade.execute('listBackblazeConnectionBuckets', {
        userId,
        connectionId: conn.id,
        env: process.env as Record<string, unknown>,
      }) as Array<{ name?: string; bucketName?: string }>;
      const bucketName = String(conn.b2BucketName || conn.bucketName || '').trim();
      if (!bucketName || !buckets.some((bucket) => String(bucket.name || bucket.bucketName || '') === bucketName)) {
        throw new Error('The selected Backblaze bucket is unavailable to this connection.');
      }
      return { success: true, latencyMs: Date.now() - started };
    }
    if (conn.provider === 'google_drive') {
      const result = await StorageServiceFacade.execute('testGoogleDriveConnection', {
        userId: getCanonicalOwner(conn),
        connectionId: conn.id,
        env: process.env as Record<string, unknown>,
      }) as { success: boolean; error?: string; latencyMs?: number };
      return { success: result.success, latencyMs: result.latencyMs ?? Date.now() - started, error: result.error };
    }

    const { s3, bucketName } = buildS3Client(conn);
    await s3.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 }));
    return { success: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      success: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Storage connection failed.',
    };
  }
}

export async function ensureCloudDirectoryMarker(
  conn: UserStorageConnection,
  folderPrefix: string,
): Promise<void> {
  if (conn.provider === 'local_fs') return;
  if (isCanonicalProvider(conn)) {
    await StorageServiceFacade.execute('writeWorkspaceStorageFile', canonicalInput(conn, folderPrefix, {
      relativePath: conn.provider === 'google_drive' ? '.srkl/.keep' : '.bzEmpty',
      content: new Uint8Array(0),
      contentType: 'application/x-empty',
    }));
    return;
  }
  const { s3, bucketName } = buildS3Client(conn);
  const key = `${folderPrefix.replace(/^\/+|\/+$/g, '')}/`;
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: Buffer.alloc(0),
    ContentType: 'application/x-directory',
  }));
}

export async function writeCloudWorkspaceFile(
  conn: UserStorageConnection,
  folderPrefix: string,
  relativePath: string,
  content: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream',
): Promise<void> {
  if (isCanonicalProvider(conn)) {
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : new Uint8Array(content);
    await StorageServiceFacade.execute('writeWorkspaceStorageFile', canonicalInput(conn, folderPrefix, {
      relativePath,
      content: bytes,
      contentType,
    }));
    return;
  }
  const { s3, bucketName } = buildS3Client(conn);
  const body = typeof content === 'string' ? Buffer.from(content, 'utf-8') : Buffer.from(content);
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: buildKey(folderPrefix, relativePath),
    Body: body,
    ContentType: contentType,
  }));
}

export async function readCloudWorkspaceFile(
  conn: UserStorageConnection,
  folderPrefix: string,
  relativePath: string,
): Promise<Buffer | null> {
  if (isCanonicalProvider(conn)) {
    const data = await StorageServiceFacade.execute('readWorkspaceStorageFile', canonicalInput(conn, folderPrefix, {
      relativePath,
    })) as Uint8Array | null;
    return data ? Buffer.from(data) : null;
  }
  const { s3, bucketName } = buildS3Client(conn);
  try {
    const result = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: buildKey(folderPrefix, relativePath),
    }));
    if (!result.Body) return null;
    return Buffer.from(await result.Body.transformToByteArray());
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
}

export async function deleteCloudWorkspaceFile(
  conn: UserStorageConnection,
  folderPrefix: string,
  relativePath: string,
): Promise<void> {
  if (isCanonicalProvider(conn)) {
    await StorageServiceFacade.execute('deleteWorkspaceStorageFile', canonicalInput(conn, folderPrefix, {
      relativePath,
    }));
    return;
  }
  const { s3, bucketName } = buildS3Client(conn);
  await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: buildKey(folderPrefix, relativePath) }));
}

/** B2 deletion is delegated to Kloks; Google Drive root folders are never recursively deleted. */
export async function deleteCloudWorkspacePrefix(
  conn: UserStorageConnection,
  folderPrefix: string,
): Promise<void> {
  if (conn.provider === 'local_fs' || conn.provider === 'google_drive') return;
  if (conn.provider === 'backblaze_b2') {
    await StorageServiceFacade.execute('deleteWorkspaceStorageFolder', canonicalInput(conn, folderPrefix));
    return;
  }

  const { s3, bucketName } = buildS3Client(conn);
  const Prefix = `${folderPrefix.replace(/^\/+|\/+$/g, '')}/`;
  let ContinuationToken: string | undefined;
  do {
    const result = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix, ContinuationToken }));
    const keys = (result.Contents || []).flatMap((item) => item.Key ? [item.Key] : []);
    for (const key of keys) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    }
    ContinuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (ContinuationToken);
}

export async function initializeCloudWorkspaceBucket(
  conn: UserStorageConnection,
  folderPrefix: string,
  workspaceName: string,
  initialEncryptedDb: Buffer,
): Promise<{ initialized: boolean; alreadyExists: boolean }> {
  if (conn.provider === 'local_fs') return { initialized: true, alreadyExists: false };
  const existing = await readCloudWorkspaceFile(conn, folderPrefix, '.srkl/workspace.db.enc');
  if (existing && existing.length > 0) return { initialized: true, alreadyExists: true };

  await ensureCloudDirectoryMarker(conn, folderPrefix);
  await writeCloudWorkspaceFile(conn, folderPrefix, '.srkl/workspace.db.enc', initialEncryptedDb);
  const manifest = {
    version: 1,
    appName: 'srkl',
    workspaceName,
    folderPrefix,
    encryptedDatabase: '.srkl/workspace.db.enc',
    cipher: 'aes-256-gcm',
    createdAt: new Date().toISOString(),
  };
  await writeCloudWorkspaceFile(conn, folderPrefix, 'manifest.json', JSON.stringify(manifest, null, 2), 'application/json');
  await writeCloudWorkspaceFile(conn, folderPrefix, 'logs/_srkl_system/.keep', '', 'text/plain');
  return { initialized: true, alreadyExists: false };
}
