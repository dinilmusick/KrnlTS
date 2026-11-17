import { afterEach, describe, expect, it, vi } from 'vitest';
import { authorizeB2, b2ListBuckets, b2ListFileNames } from './b2DirectCore.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

function authResponse(allowed?: Record<string, unknown>) {
  return new Response(JSON.stringify({
    accountId: 'account-1',
    authorizationToken: 'account-token',
    apiUrl: 'https://api.example.test',
    downloadUrl: 'https://download.example.test',
    ...(allowed ? { allowed } : {}),
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('canonical Backblaze B2 workspace client', () => {
  it('redacts provider response bodies from authorization errors', async () => {
    const marker = 'provider-echoed-secret-material';
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(marker, { status: 401 }))
      .mockResolvedValueOnce(new Response(marker, { status: 403 }));
    vi.stubGlobal('fetch', fetcher);

    let message = '';
    try {
      await authorizeB2(
        `auth-key-${crypto.randomUUID()}`,
        `auth-secret-${crypto.randomUUID()}`,
      );
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toBe('Backblaze B2 authorization failed with HTTP 403.');
    expect(message).not.toContain(marker);
  });

  it('returns only a bucket explicitly identified by restricted-key authorization metadata', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(authResponse({
      bucketId: 'restricted-bucket-id',
      bucketName: 'private-workspace',
    }));
    vi.stubGlobal('fetch', fetcher);

    await expect(b2ListBuckets(
      `restricted-key-${crypto.randomUUID()}`,
      `restricted-secret-${crypto.randomUUID()}`,
      undefined,
      'private-workspace',
    )).resolves.toEqual([{
      bucketId: 'restricted-bucket-id',
      bucketName: 'private-workspace',
    }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('never fabricates a bucket when restricted authorization omits its bucket ID', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(authResponse({
      bucketName: 'private-workspace',
    }));
    vi.stubGlobal('fetch', fetcher);

    await expect(b2ListBuckets(
      `restricted-missing-id-key-${crypto.randomUUID()}`,
      `restricted-missing-id-secret-${crypto.randomUUID()}`,
      undefined,
      'private-workspace',
    )).resolves.toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('surfaces unrestricted bucket discovery failures instead of returning an empty list', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(authResponse())
      .mockResolvedValueOnce(new Response('secret diagnostic', { status: 403 }));
    vi.stubGlobal('fetch', fetcher);

    await expect(b2ListBuckets(
      `discovery-key-${crypto.randomUUID()}`,
      `discovery-secret-${crypto.randomUUID()}`,
    )).rejects.toThrow('Backblaze B2 bucket discovery failed with HTTP 403.');
  });

  it('surfaces file listing failures and does not treat them as empty directories', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(authResponse())
      .mockResolvedValueOnce(new Response(JSON.stringify({
        buckets: [{ bucketId: 'bucket-1', bucketName: 'workspace-bucket' }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response('secret diagnostic', { status: 500 }));
    vi.stubGlobal('fetch', fetcher);

    await expect(b2ListFileNames(
      `listing-key-${crypto.randomUUID()}`,
      `listing-secret-${crypto.randomUUID()}`,
      'workspace-bucket',
      'workspace/root/',
    )).rejects.toThrow('B2 file listing failed with HTTP 500.');
  });
});
