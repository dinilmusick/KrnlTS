/**
 * @file vaultAccessPresigner.ts
 * @description Generates presigned cloud bucket URLs (B2/R2/S3) and client decrypt key material
 * for ecosystem apps (e.g. DEPM) to read and process workspace SQLite vaults client-side.
 * File size strictly < 200 lines.
 */

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { buildS3Client } from './cloudStorageService';
import { getDefaultWorkspaceSecret } from './cryptoVault';
import { UserStorageConnection } from '@/libraries/types/auth';

export interface ClientVaultAccessGrant {
  workspaceId: string;
  workspaceName: string;
  folderPrefix: string;
  presignedUrl: string;
  keyMaterial: {
    secretHex: string;
    cipher: 'aes-256-gcm';
    envelope: 'salt_iv_tag_ciphertext';
  };
  storageProvider: string;
  expiresAt: string;
  ttlSeconds: number;
}

/**
 * Generate a 15-minute presigned GET URL for the workspace SQLite encrypted database file.
 * Prioritized for Backblaze B2 and Cloudflare R2 object storage.
 */
export async function generatePresignedVaultUrl(
  conn: UserStorageConnection,
  folderPrefix: string,
  ttlSeconds = 900
): Promise<string> {
  if (conn.provider === 'local_fs') {
    throw new Error('Local filesystem vaults cannot be accessed via cloud presigned URLs. Configure B2 or R2.');
  }

  const { s3, bucketName } = buildS3Client(conn);
  const cleanPrefix = folderPrefix.replace(/^\/+|\/+$/g, '');
  const key = `${cleanPrefix}/.srkl/workspace.db.enc`;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: ttlSeconds });
}

/**
 * Derives scoped key material for the client to decrypt the vault in browser memory.
 */
export function deriveClientVaultKeyMaterial(userId: string, workspaceId: string): {
  secretHex: string;
  cipher: 'aes-256-gcm';
  envelope: 'salt_iv_tag_ciphertext';
} {
  const secret = getDefaultWorkspaceSecret(userId, workspaceId);
  return {
    secretHex: secret,
    cipher: 'aes-256-gcm',
    envelope: 'salt_iv_tag_ciphertext',
  };
}
