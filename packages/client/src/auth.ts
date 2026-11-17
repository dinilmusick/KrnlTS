import type { DeploymentEnvironment } from '@dinilmusick/gutts/auth';

export {
  LuthAuthClient,
  createLuthAuthClient,
  hydrateLuthTokenFromUrl,
  resolveClientOrigin,
  resolveClientEnvironment,
  LuthAuthError,
  DEFAULT_LUTH_URL,
} from '@dinilmusick/gutts/auth';

export type {
  DeploymentEnvironment,
  EmailSignInCredentials,
  EmailSignUpData,
  GoogleSignInOptions,
  LuthAuthClientConfig,
  LuthAuthTokenStore,
  LuthSession,
  LuthUser,
  LuthSessionResult,
  RegisterApplicationResult,
} from '@dinilmusick/gutts/auth';

export interface LuthDeploymentRecord {
  id: string;
  url: string;
  label?: string;
  environment?: DeploymentEnvironment;
  isActive: boolean;
  isPrimary?: boolean;
  priority?: number;
}

export {
  LuthAuthClient as CanonicalAuthClient,
  createLuthAuthClient as createCanonicalAuthClient,
} from '@dinilmusick/gutts/auth';

export {
  CANONICAL_PUBLIC_ROUTES,
  extractLuthToken,
  isPublicRoute,
  verifyLuthRequest,
} from './UniversalLuthGuard.js';
export type { LuthPrincipal } from './UniversalLuthGuard.js';

/** Creates an authenticated fetch function that automatically injects Luth bearer headers and credentials: 'include'. */
export function createUniversalAuthFetch(authClient: { getAuthHeaders: () => HeadersInit }) {
  return async function universalAuthFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers();
    if (typeof input === 'object' && input !== null && 'headers' in input && input.headers) {
      new Headers(input.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }
    if (init.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }
    new Headers(authClient.getAuthHeaders()).forEach((value, key) => {
      if (!headers.has(key)) headers.set(key, value);
    });
    return fetch(input, {
      ...init,
      headers,
      credentials: init.credentials ?? 'include',
    });
  };
}


