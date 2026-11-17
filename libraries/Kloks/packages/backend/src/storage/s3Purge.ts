/**
 * S3 & Backblaze B2 Zero-Asterisk Permanent Purge & Folder Engine
 */

export async function ensureS3DirectoryMarker(s3: any, bucketName: string, folderPrefix: string): Promise<void> {
  const clean = folderPrefix.replace(/^\/+|\/+$/g, '');
  if (!clean) return;
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: `${clean}/`,
      Body: Buffer.alloc(0),
      ContentType: 'application/x-directory',
    }));
  } catch (err: any) {
    console.warn(`[s3Purge] Directory marker warning for ${clean}/:`, err?.message);
  }
}

export async function permanentDeleteS3Object(s3: any, bucketName: string, fullKey: string): Promise<boolean> {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fullKey }));
    return true;
  } catch (err) {
    console.warn(`[s3Purge] Error deleting object ${fullKey}:`, err);
    return false;
  }
}

export async function permanentDeleteS3Folder(
  s3: any,
  bucketName: string,
  targetPrefix: string
): Promise<{ success: boolean; deletedCount: number }> {
  let deletedCount = 0;
  const bare = targetPrefix.replace(/\/+$/, '');
  const isMatch = (k: string) => k === bare || k === `${bare}/` || k.startsWith(`${bare}/`);

  try {
    const { DeleteObjectsCommand, DeleteObjectCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    let contToken: string | undefined;
    let more = true;
    while (more) {
      const v2Res: any = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: bare, ContinuationToken: contToken }));
      const items: { Key: string }[] = [];
      for (const obj of v2Res.Contents || []) {
        if (obj.Key && isMatch(obj.Key)) {
          items.push({ Key: obj.Key });
        }
      }
      if (items.length > 0) {
        for (let i = 0; i < items.length; i += 1000) {
          const batch = items.slice(i, i + 1000);
          try {
            await s3.send(new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: batch, Quiet: true } }));
            deletedCount += batch.length;
          } catch {
            for (const it of batch) {
              try {
                await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: it.Key }));
                deletedCount++;
              } catch {}
            }
          }
        }
      }
      more = Boolean(v2Res.IsTruncated);
      contToken = v2Res.NextContinuationToken;
    }
    return { success: true, deletedCount };
  } catch (err) {
    console.error('[s3Purge] permanentDeleteS3Folder failed:', err);
    return { success: false, deletedCount };
  }
}

export async function renameS3Folder(
  s3: any,
  bucketName: string,
  oldPrefix: string,
  newPrefix: string
): Promise<{ success: boolean; movedCount: number }> {
  const oldClean = oldPrefix.replace(/^\/+|\/+$/g, '');
  const newClean = newPrefix.replace(/^\/+|\/+$/g, '');
  if (!oldClean || !newClean || oldClean === newClean) return { success: false, movedCount: 0 };

  const oldFolderKey = oldClean;
  const oldDir = `${oldClean}/`;
  const newDir = `${newClean}/`;
  let movedCount = 0;

  try {
    const { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = await import('@aws-sdk/client-s3');
    let contToken: string | undefined;
    let more = true;
    const items: { Key: string; isDir: boolean; subRel: string }[] = [];

    while (more) {
      const res: any = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: oldFolderKey, ContinuationToken: contToken }));
      for (const obj of res.Contents || []) {
        if (!obj.Key) continue;
        if (obj.Key === oldFolderKey || obj.Key === oldDir) items.push({ Key: obj.Key, isDir: true, subRel: '' });
        else if (obj.Key.startsWith(oldDir)) items.push({ Key: obj.Key, isDir: obj.Key.endsWith('/'), subRel: obj.Key.substring(oldDir.length) });
      }
      more = Boolean(res.IsTruncated);
      contToken = res.NextContinuationToken;
    }

    await ensureS3DirectoryMarker(s3, bucketName, newClean);
    for (const item of items) {
      if (item.isDir) {
        if (item.subRel) await ensureS3DirectoryMarker(s3, bucketName, `${newClean}/${item.subRel}`);
        continue;
      }
      const newKey = `${newDir}${item.subRel}`;
      const getRes: any = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: item.Key }));
      if (getRes.Body) {
        const bytes = await getRes.Body.transformToByteArray();
        await s3.send(new PutObjectCommand({ Bucket: bucketName, Key: newKey, Body: bytes, ContentType: getRes.ContentType || 'application/octet-stream' }));
        movedCount++;
      }
    }

    await permanentDeleteS3Folder(s3, bucketName, oldFolderKey);
    return { success: true, movedCount };
  } catch (err) {
    console.error('[s3Purge] renameS3Folder failed:', err);
    return { success: false, movedCount };
  }
}
