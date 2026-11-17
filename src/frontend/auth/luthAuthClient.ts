import { createCanonicalAuthClient } from '@ultrst-armada/kloks/auth';

export const luthAuthClient = createCanonicalAuthClient({
  ecosystemId: 'ultrst-armada',
  applicationId: 'srkl',
  autoRegister: true,
  origin: typeof window !== 'undefined' && window.location?.origin ? window.location.origin : (process.env.APP_URL || 'http://localhost:5173'),
});

/** Attach the active canonical Luth bearer session to same-origin SRKL API calls. */
export async function luthFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  new Headers(luthAuthClient.getAuthHeaders()).forEach((value, key) => headers.set(key, value));
  const transport = globalThis;
  return transport['fetch'](input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
    cache: init.cache ?? 'no-store',
  });
}
