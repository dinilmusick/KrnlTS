import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCloudflareData } from './cloudflareIntegrationCore.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Cloudflare provider credential boundary', () => {
  it('does not forward Cloudflare credentials to SRKL when Cloudflare API access fails', async () => {
    const cloudflareToken = 'cloudflare-private-token-marker';
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(
      new Error('Cloudflare upstream unavailable'),
    );
    vi.stubGlobal('fetch', fetcher);

    const result = await fetchCloudflareData({
      token: cloudflareToken,
      accountName: 'Cloudflare',
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Cloudflare API request failed/i);
    expect(result.error).not.toContain(cloudflareToken);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toMatch(/^https:\/\/api\.cloudflare\.com\//);
    expect(fetcher.mock.calls.some(([input]) => String(input).includes('/api/resources'))).toBe(false);
    expect(fetcher.mock.calls.some(([input]) => String(input).includes('/api/srkl/'))).toBe(false);
  });
});
