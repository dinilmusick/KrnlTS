import { describe, expect, it } from 'vitest';
import { fetchHandler } from './httpsAdapter.js';

describe('Kone HTTP adapter', () => {
  it('serves a public health response with same-origin CORS', async () => {
    const response = await fetchHandler(
      new Request('http://localhost:4173/api/health', {
        headers: { Origin: 'http://localhost:4173' },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:4173');
    await expect(response.json()).resolves.toMatchObject({ status: 'ok', service: 'kone' });
  });

  it('rejects protected routes before invoking services when no Luth session is present', async () => {
    const response = await fetchHandler(
      new Request('http://localhost:4173/api/auth/workspaces'),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'A verified Luth session is required.',
    });
  });

  it('does not grant CORS access to an unrelated origin', async () => {
    const response = await fetchHandler(
      new Request('http://localhost:4173/api/health', {
        headers: { Origin: 'https://evil.example' },
      }),
    );

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
