import { DEFAULT_LUTH_URL } from '@dinilmusick/gutts/auth';

export interface LuthPrincipal {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const CANONICAL_PUBLIC_ROUTES: (string | RegExp)[] = [
  '/health',
  '/api/health',
  '/api/status',
  '/api/auth',
  /^\/api(\/v1)?\/auth(\/.*)?$/,
  /^\/api(\/v1)?\/database\/status$/,
  /^\/api(\/v1)?\/guest(\/.*)?$/,
  /^\/api(\/v1)?\/discovery(\/.*)?$/,
  /^\/api(\/v1)?\/spec(\/.*)?$/,
];

const SESSION_CACHE_TTL_MS = 60_000;
const sessionCache = new Map<string, { principal: LuthPrincipal; expiresAt: number }>();

export function extractLuthToken(request: Request): string {
  const authorization = request.headers.get('authorization') || '';
  const bearer = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  if (bearer) return bearer[1];
  const apiKey = request.headers.get('x-api-key')?.trim();
  if (apiKey) return apiKey;
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const prefix of ['better-auth.session_token=', '__Secure-better-auth.session_token=', 'luth_session=']) {
    const found = cookies.find(c => c.startsWith(prefix));
    if (found) {
      try {
        return decodeURIComponent(found.slice(prefix.length));
      } catch {
        return '';
      }
    }
  }
  return '';
}

export function isPublicRoute(pathname: string, extraPublicRoutes?: (string | RegExp)[]): boolean {
  const routes = extraPublicRoutes
    ? [...CANONICAL_PUBLIC_ROUTES, ...extraPublicRoutes]
    : CANONICAL_PUBLIC_ROUTES;
  return routes.some(route => (typeof route === 'string' ? pathname === route : route.test(pathname)));
}

export async function verifyLuthRequest(
  request: Request,
  options?: { luthUrl?: string; extraPublicRoutes?: (string | RegExp)[] }
): Promise<LuthPrincipal | Response | null> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return null;
  if (isPublicRoute(url.pathname, options?.extraPublicRoutes)) return null;

  const isMcp = url.pathname.includes('/mcp');
  const token = extractLuthToken(request);
  if (!token) {
    const payload = isMcp
      ? { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'A verified Luth session is required.' } }
      : { success: false, error: 'A verified Luth session is required.' };
    return new Response(JSON.stringify(payload), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const now = Date.now();
  const cached = sessionCache.get(token);
  if (cached && cached.expiresAt > now) {
    return cached.principal;
  }

  try {
    const luthUrl = options?.luthUrl || DEFAULT_LUTH_URL;
    const res = await fetch(`${luthUrl}/api/session`, {
      headers: {
        authorization: `Bearer ${token}`,
        cookie: request.headers.get('cookie') || '',
        origin: url.origin,
      },
    });

    if (!res.ok) {
      const payload = isMcp
        ? { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'The Luth session is invalid or expired.' } }
        : { success: false, error: 'The Luth session is invalid or expired.' };
      return new Response(JSON.stringify(payload), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await res.json() as any;
    const user = data?.user || (data?.authenticated ? data?.session?.user : null);
    if (!user || !user.id) {
      const payload = isMcp
        ? { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'The Luth session is invalid or expired.' } }
        : { success: false, error: 'The Luth session is invalid or expired.' };
      return new Response(JSON.stringify(payload), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const principal: LuthPrincipal = {
      id: String(user.id),
      email: String(user.email || ''),
      name: String(user.name || user.email?.split('@')[0] || ''),
      role: String(user.role || 'user'),
    };

    sessionCache.set(token, { principal, expiresAt: now + SESSION_CACHE_TTL_MS });
    return principal;
  } catch {
    const payload = isMcp
      ? { jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Canonical Luth authentication service unavailable.' } }
      : { success: false, error: 'Canonical Luth authentication service unavailable.' };
    return new Response(JSON.stringify(payload), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}
