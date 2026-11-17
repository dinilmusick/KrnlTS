/**
 * @file remoteBackblaze.ts
 * @description Remote dispatcher contacting Backblaze B2 endpoints.
 */

export class RemoteBackblaze {
  public async listBuckets(creds: Record<string, unknown>) {
    const res = await fetch('/api/backblaze/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    return res.json();
  }

  public async createBucket(creds: Record<string, unknown>, name: string, type: 'allPublic' | 'allPrivate') {
    const res = await fetch('/api/backblaze/create-bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...creds, bucketName: name, bucketType: type }),
    });
    return res.json();
  }

  public async deleteBucket(creds: Record<string, unknown>, bucketId: string) {
    const res = await fetch('/api/backblaze/delete-bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...creds, bucketId }),
    });
    return res.json();
  }

  public async listFiles(creds: Record<string, unknown>, bucketId: string) {
    const res = await fetch('/api/backblaze/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...creds, bucketId }),
    });
    return res.json();
  }
}

export const remoteBackblaze = new RemoteBackblaze();
