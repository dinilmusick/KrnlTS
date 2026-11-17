import { describe, expect, it, vi } from 'vitest';
import { withAuth, withCors } from './middleware.js';

describe('withAuth', () => {
  it('accepts a valid bearer token and invokes the verifier once', async () => {
    const verify = vi.fn(async (token: string) => token === 'valid-token');
    const middleware = withAuth(verify);
    const result = await middleware(new Request('https://example.test/api/private', {
      headers: { authorization: 'Bearer valid-token' },
    }));
    expect(result).toBeNull();
    expect(verify).toHaveBeenCalledOnce();
    expect(verify).toHaveBeenCalledWith('valid-token');
  });

  it('treats the HTTP authentication scheme as case-insensitive', async () => {
    const verify = vi.fn(async () => true);
    const result = await withAuth(verify)(new Request('https://example.test/api/private', {
      headers: { authorization: 'bearer valid-token' },
    }));
    expect(result).toBeNull();
    expect(verify).toHaveBeenCalledWith('valid-token');
  });

  it.each([
    ['missing authorization', undefined],
    ['wrong scheme', 'Basic abc'],
    ['empty bearer token', 'Bearer '],
    ['multiple token segments', 'Bearer first second'],
  ])('rejects %s without calling the verifier', async (_label, authorization) => {
    const verify = vi.fn(async () => true);
    const request = authorization === undefined
      ? new Request('https://example.test/api/private')
      : new Request('https://example.test/api/private', { headers: { authorization } });
    const result = await withAuth(verify)(request);
    expect(result?.status).toBe(401);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects an invalid token with 401', async () => {
    const result = await withAuth(async () => false)(new Request('https://example.test/api/private', {
      headers: { authorization: 'Bearer invalid-token' },
    }));
    expect(result?.status).toBe(401);
  });

  it('fails closed with a controlled 503 when the verifier is unavailable', async () => {
    const result = await withAuth(async () => { throw new Error('identity service unavailable'); })(
      new Request('https://example.test/api/private', { headers: { authorization: 'Bearer token' } }),
    );
    expect(result?.status).toBe(503);
  });
});

describe('withCors', () => {
  it('answers preflight requests with 204 and the configured origin', async () => {
    const result = await withCors('https://app.example.test')(
      new Request('https://api.example.test/api/private', { method: 'OPTIONS' }),
    );
    expect(result?.status).toBe(204);
    expect(result?.headers.get('access-control-allow-origin')).toBe('https://app.example.test');
    expect(result?.headers.get('access-control-allow-methods')).toContain('OPTIONS');
  });

  it('does not intercept non-preflight requests', async () => {
    const result = await withCors()(new Request('https://api.example.test/api/private'));
    expect(result).toBeNull();
  });
});
