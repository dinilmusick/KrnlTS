import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authorizeB2,
  b2DownloadFile,
  b2ListBuckets,
  b2ListFileNames,
  b2UploadFile,
} from './B2DirectClient.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Fetch-native Backblaze B2 client security and portability', () => {
  it('never includes the provider error body in authorization failures', async () => {
    const secretMarker = 'echoed-secret-key-material-should-never-escape';
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(secretMarker, { status: 401 }),
    );
    vi.stubGlobal('fetch', fetcher);

    let message = '';
    try {
      await authorizeB2(`test-key-${crypto.randomUUID()}`, `test-app-key-${crypto.randomUUID()}`);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toMatch(/HTTP 401/i);
    expect(message).not.toContain(secretMarker);
    expect(message).not.toMatch(/test-app-key-/);
  });

  it('lets Fetch determine upload Content-Length from the byte body', async () => {
    const apiUrl = 'https://api.example.test';
    const uploadUrl = 'https://upload.example.test/file';
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authorizationToken: 'account-token',
        apiUrl,
        downloadUrl: 'https://download.example.test',
        accountId: 'account-1',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        buckets: [{ bucketName: 'workspace-bucket', bucketId: 'bucket-1' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        uploadUrl,
        authorizationToken: 'upload-token',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ fileId: 'file-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', fetcher);

    await expect(b2UploadFile(
      `worker-key-${crypto.randomUUID()}`,
      `worker-app-key-${crypto.randomUUID()}`,
      'workspace-bucket',
      'workspace/file.txt',
      new TextEncoder().encode('workspace data'),
      'text/plain',
    )).resolves.toMatchObject({ fileId: 'file-1' });

    const uploadCall = fetcher.mock.calls[3];
    expect(String(uploadCall[0])).toBe(uploadUrl);
    const headers = new Headers(uploadCall[1]?.headers);
    expect(headers.get('Authorization')).toBe('upload-token');
    expect(headers.get('Content-Length')).toBeNull();
    expect(headers.get('X-Bz-Content-Sha1')).toMatch(/^[a-f0-9]{40}$/);
    expect(uploadCall[1]?.body).toBeInstanceOf(Uint8Array);
  });

  it('does not convert failed bucket discovery into an empty bucket collection', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authorizationToken: 'account-token',
        apiUrl: 'https://api.example.test',
        downloadUrl: 'https://download.example.test',
        accountId: 'account-1',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response('secret provider diagnostic', { status: 403 }));
    vi.stubGlobal('fetch', fetcher);

    await expect(b2ListBuckets('bucket-list-key', 'bucket-list-secret'))
      .rejects.toThrow('B2 bucket discovery failed with HTTP 403.');
  });

  it('does not convert failed file listing into an empty file collection', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authorizationToken: 'account-token',
        apiUrl: 'https://api.example.test',
        downloadUrl: 'https://download.example.test',
        accountId: 'account-1',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        buckets: [{ bucketName: 'workspace-bucket', bucketId: 'bucket-1' }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response('secret provider diagnostic', { status: 500 }));
    vi.stubGlobal('fetch', fetcher);

    await expect(b2ListFileNames('file-list-key', 'file-list-secret', 'workspace-bucket', 'root/'))
      .rejects.toThrow('B2 file listing failed with HTTP 500.');
  });

  it('returns null only for a missing file and preserves other download failures', async () => {
    const makeFetcher = (status: number) => vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authorizationToken: `account-token-${status}`,
        apiUrl: 'https://api.example.test',
        downloadUrl: 'https://download.example.test',
        accountId: 'account-1',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response('provider diagnostic', { status }));
    vi.stubGlobal('fetch', makeFetcher(403));

    await expect(b2DownloadFile('download-key-403', 'download-secret-403', 'bucket', 'root/file'))
      .rejects.toThrow('B2 file download failed with HTTP 403.');

    vi.stubGlobal('fetch', makeFetcher(404));
    await expect(b2DownloadFile('download-key-404', 'download-secret-404', 'bucket', 'root/file'))
      .resolves.toBeNull();
  });
});
