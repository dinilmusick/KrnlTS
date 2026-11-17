/**
 * Backward-compatible storage-layer entrypoint for the canonical B2 client.
 * All provider behavior lives in core/b2DirectCore so connection discovery
 * and workspace file operations share the same authorization and error rules.
 */
import {
  authorizeB2,
  b2ListBuckets,
  b2ListFileNames,
  b2UploadFile as uploadCanonicalB2File,
  b2DownloadFile,
} from '../core/b2DirectCore.js';

export { authorizeB2, b2ListBuckets, b2ListFileNames, b2DownloadFile };
export type { B2AuthData as B2AuthToken } from '../core/b2DirectCore.js';

/** Preserve the legacy string-or-byte payload contract. */
export function b2UploadFile(
  keyId: string,
  applicationKey: string,
  bucketName: string,
  fileName: string,
  content: Uint8Array | string,
  contentType = 'application/json',
): Promise<any> {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  return uploadCanonicalB2File(keyId, applicationKey, bucketName, fileName, bytes, contentType);
}
