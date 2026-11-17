/**
 * @file backblazeClient.ts
 * @description Client-side API caller for Backblaze B2 operations.
 */

export class BackblazeClient {
  public async verifyKeys(keyId: string, appKey: string): Promise<boolean> {
    const res = await fetch('/api/backblaze/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId, applicationKey: appKey }),
    });
    const data = await res.json();
    return res.ok && !!data.success;
  }
}

export const backblazeClient = new BackblazeClient();
