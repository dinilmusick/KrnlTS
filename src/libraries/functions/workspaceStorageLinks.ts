// ══════════════════════════════════════════════════════════════════════════════
// Workspace Storage Deep-Link Resolver for SRKL (Law L17, L18, L19)
// ══════════════════════════════════════════════════════════════════════════════

import { SrklWorkspace, UserStorageConnection } from '../types/auth';

export interface StorageLinkInfo {
  provider: string;
  isCloud: boolean;
  actionUrl: string | null;
  targetDisplay: string;
  buttonLabel: string; // <= 4 words
  description: string; // D+Hover description
}

export function getSrklWorkspaceStorageLink(
  ws: SrklWorkspace,
  conn?: UserStorageConnection
): StorageLinkInfo {
  const provider = ws.storageProvider || conn?.provider || 'local_fs';

  if (provider === 'backblaze_b2') {
    const bucket = conn?.b2BucketName || 'b2-bucket';
    return {
      provider,
      isCloud: true,
      actionUrl: 'https://secure.backblaze.com/b2_buckets.htm',
      targetDisplay: bucket,
      buttonLabel: 'OPEN B2 BUCKET',
      description: `Open Backblaze B2 web console for bucket ${bucket}.`,
    };
  }

  if (provider === 'aws_s3') {
    const bucket = conn?.bucketName || 's3-bucket';
    const region = conn?.region || 'us-east-1';
    return {
      provider,
      isCloud: true,
      actionUrl: `https://s3.console.aws.amazon.com/s3/buckets/${bucket}?region=${region}`,
      targetDisplay: bucket,
      buttonLabel: 'OPEN S3 BUCKET',
      description: `Open AWS S3 console for bucket ${bucket} in region ${region}.`,
    };
  }

  if (provider === 'cloudflare_r2') {
    const bucket = conn?.bucketName || 'r2-bucket';
    const account = conn?.r2AccountId;
    const url = account
      ? `https://dash.cloudflare.com/${account}/r2/default/buckets/${bucket}`
      : `https://dash.cloudflare.com/?to=/:account/r2/default/buckets/${bucket}`;
    return {
      provider,
      isCloud: true,
      actionUrl: url,
      targetDisplay: bucket,
      buttonLabel: 'OPEN R2 BUCKET',
      description: `Open Cloudflare R2 dashboard for bucket ${bucket}.`,
    };
  }

  // Fallback: local_fs
  const folder = (ws.workspacePath || '').replace(/^\.\//, '') || ws.name;
  return {
    provider: 'local_fs',
    isCloud: false,
    actionUrl: null,
    targetDisplay: folder,
    buttonLabel: 'REVEAL LOCAL FOLDER',
    description: `Inspect and reveal workspace directory ${folder} in local filesystem.`,
  };
}
