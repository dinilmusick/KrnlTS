import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getPrimarySystemBucket, SystemBucketEntry } from './system-buckets-table';

export interface SystemBucketConfig {
  provider: string;
  bucketName: string;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
}

export async function getSystemBucketConfig(): Promise<SystemBucketConfig> {
  const bkt = await getPrimarySystemBucket();
  return {
    provider: bkt?.provider || 's3',
    bucketName: bkt?.bucket_name || 'ultrst-system-bucket',
    endpoint: bkt?.endpoint || undefined,
    region: bkt?.region || 'us-east-1',
    accessKeyId: bkt?.access_key_id || '',
    secretAccessKey: bkt?.secret_access_key || '',
    publicUrl: bkt?.public_url || undefined,
  };
}

export function buildSystemBucketS3Client(config: SystemBucketConfig): S3Client {
  let endpoint = config.endpoint?.trim();
  if (endpoint && !/^https?:\/\//i.test(endpoint)) {
    endpoint = `https://${endpoint}`;
  }
  const isCustomEndpoint = !!endpoint && !endpoint.includes('amazonaws.com');
  return new S3Client({
    region: config.region || 'auto',
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: isCustomEndpoint,
  });
}

export async function systemBucketUpload(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}): Promise<{ key: string; bucket: string; publicUrl?: string }> {
  const config = await getSystemBucketConfig();
  const s3 = buildSystemBucketS3Client(config);
  const cleanKey = params.key.replace(/^\/+/, '');

  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: cleanKey,
      Body: typeof params.body === 'string' ? Buffer.from(params.body) : params.body,
      ContentType: params.contentType || 'application/octet-stream',
    })
  );

  const publicUrl = config.publicUrl
    ? `${config.publicUrl.replace(/\/+$/, '')}/${cleanKey}`
    : undefined;

  return { key: cleanKey, bucket: config.bucketName, publicUrl };
}

export async function systemBucketDownload(key: string): Promise<{
  key: string;
  body: Uint8Array;
  contentType?: string;
}> {
  const config = await getSystemBucketConfig();
  const s3 = buildSystemBucketS3Client(config);
  const cleanKey = key.replace(/^\/+/, '');

  const res = await s3.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: cleanKey,
    })
  );

  const bytes = res.Body ? await (res.Body as any).transformToByteArray() : new Uint8Array(0);
  return { key: cleanKey, body: bytes, contentType: res.ContentType };
}

export async function systemBucketGetPresignedUrl(params: {
  key: string;
  operation: 'get' | 'put';
  expiresIn?: number;
}): Promise<string> {
  const config = await getSystemBucketConfig();
  const s3 = buildSystemBucketS3Client(config);
  const cleanKey = params.key.replace(/^\/+/, '');
  const expiresIn = params.expiresIn || 900;

  const command =
    params.operation === 'put'
      ? new PutObjectCommand({ Bucket: config.bucketName, Key: cleanKey })
      : new GetObjectCommand({ Bucket: config.bucketName, Key: cleanKey });

  return await getSignedUrl(s3, command, { expiresIn });
}

export async function systemBucketList(params?: {
  prefix?: string;
  maxKeys?: number;
}): Promise<{ keys: string[]; bucket: string }> {
  const config = await getSystemBucketConfig();
  const s3 = buildSystemBucketS3Client(config);

  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: params?.prefix ? params.prefix.replace(/^\/+/, '') : undefined,
      MaxKeys: params?.maxKeys || 1000,
    })
  );

  const keys = (res.Contents || []).map((c) => c.Key || '').filter(Boolean);
  return { keys, bucket: config.bucketName };
}

export async function systemBucketDelete(key: string): Promise<boolean> {
  const config = await getSystemBucketConfig();
  const s3 = buildSystemBucketS3Client(config);
  const cleanKey = key.replace(/^\/+/, '');

  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: cleanKey,
    })
  );
  return true;
}
