import type { Request } from 'express';
import { DEFAULT_LUTH_URL } from '@ultrst-armada/kloks/auth';

export interface LuthVerifiedUser {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
  emailVerified?: boolean;
}

export interface VerifiedPrincipal extends LuthVerifiedUser { role?: 'admin' | 'user' | 'system' }

const verifiedPrincipals = new WeakMap<Request, VerifiedPrincipal>();

export function setVerifiedPrincipal(req: Request, principal: VerifiedPrincipal): void {
  verifiedPrincipals.set(req, principal);
}

export function getVerifiedPrincipal(req: Request): VerifiedPrincipal | null {
  return verifiedPrincipals.get(req) || null;
}

export interface LuthVerifiedSession {
  authenticated: true;
  user: LuthVerifiedUser;
}

/** Verify bearer credentials with Luth; never decode or trust client identity claims locally. */
export async function verifyLuthSession(
  authorization: string,
  fetcher: typeof fetch = fetch,
): Promise<LuthVerifiedSession | null> {
  if (!/^Bearer\s+\S+$/i.test(authorization.trim())) return null;

  try {
    const response = await fetcher(`${DEFAULT_LUTH_URL}/api/session`, {
      headers: { Authorization: authorization, 'x-app-id': 'srkl' },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const payload = await response.json() as {
      authenticated?: boolean;
      user?: Partial<LuthVerifiedUser> | null;
    };
    if (
      payload.authenticated !== true ||
      typeof payload.user?.id !== 'string' ||
      !payload.user.id.trim() ||
      typeof payload.user.email !== 'string' ||
      !payload.user.email.trim()
    ) return null;

    return {
      authenticated: true,
      user: {
        id: payload.user.id,
        email: payload.user.email,
        name: typeof payload.user.name === 'string' ? payload.user.name : undefined,
        image: payload.user.image ?? null,
        emailVerified: payload.user.emailVerified === true,
      },
    };
  } catch {
    return null;
  }
}
