import { LuthAuthClient } from '@ultrst-armada/kloks/auth';

export const SKIPO_ECOSYSTEM_ID = 'ultrst-armada';
export const SKIPO_APPLICATION_ID = 'kone';

export function getSkipoApplicationId(): string {
  return SKIPO_APPLICATION_ID;
}

export const luthAuthClient = new LuthAuthClient({
  ecosystemId: SKIPO_ECOSYSTEM_ID,
  applicationId: getSkipoApplicationId(),
  luthUrl: '/api/luth',
  autoRegister: true,
});

/** All same-origin application API requests carry the active Luth session. */
export async function luthFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  new Headers(luthAuthClient.getAuthHeaders()).forEach((value, key) => headers.set(key, value));
  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
    cache: init.cache ?? 'no-store',
  });
}