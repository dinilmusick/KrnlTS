import { DEFAULT_LUTH_URL } from '@ultrst-armada/kloks/auth';

function stripGuestLeaseCookie(cookie: string | null): string | null {
  if (!cookie) return null;
  const retained = cookie.split(";").map((part) => part.trim())
    .filter((part) => !part.startsWith("__Host-skipo_guest="));
  return retained.length ? retained.join("; ") : null;
}

function hasGuestLeaseCredential(request: Request): boolean {
  if (request.headers.get("x-skipo-guest-lease")) return true;
  return (request.headers.get("cookie") ?? "").split(";")
    .some((part) => part.trim().startsWith("__Host-skipo_guest="));
}

export interface VerifiedLuthSession {
  authenticated: true;
  user: { id: string; [key: string]: unknown };
  session: { id: string; expiresAt?: string; [key: string]: unknown };
}

/** Delegate request authentication to Luth; never trust an app-supplied user ID. */
export async function getLuthSession(request: Request): Promise<VerifiedLuthSession | null> {
  const headers = new Headers({ 'x-app-id': request.headers.get('x-app-id') || new URL(request.url).hostname });
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);
  const cookie = stripGuestLeaseCookie(request.headers.get('cookie'));
  if (cookie) headers.set('cookie', cookie);
  const origin = request.headers.get('origin');
  if (origin) headers.set('origin', origin);

  let response: Response;
  try {
    response = await fetch(`${DEFAULT_LUTH_URL}/api/session`, {
      method: 'GET', headers, cache: 'no-store', redirect: 'manual',
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null) as Record<string, any> | null;
  if (payload?.authenticated !== true ||
      typeof payload?.user?.id !== 'string' ||
      typeof payload?.session?.id !== 'string') return null;
  return payload as VerifiedLuthSession;
}

/** Proxy Luth login/session endpoints without embedding provider-specific auth logic. */
export async function proxyLuthAuthRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const appOwned = url.pathname === '/api/auth/workspaces' || url.pathname.startsWith('/api/auth/storage/');
  if (!url.pathname.startsWith('/api/auth/') || appOwned) return null;
  if (url.pathname === '/api/auth/admin/login') {
    return Response.json({ success: false, error: 'Administrative login is not provided by Luth user authentication.' }, { status: 403 });
  }
  const headers = new Headers({ 'x-app-id': request.headers.get('x-app-id') || url.hostname });
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);
  const cookie = stripGuestLeaseCookie(request.headers.get('cookie'));
  if (cookie) headers.set('cookie', cookie);
  for (const name of ['content-type', 'origin', 'user-agent']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(`${DEFAULT_LUTH_URL}${url.pathname}${url.search}`, {
      method: request.method, headers,
      ...(request.method === 'GET' || request.method === 'HEAD' ? {} : { body: await request.arrayBuffer() }),
      redirect: 'manual', cache: 'no-store',
    });
    const responseHeaders = new Headers();
    for (const name of ['content-type', 'set-cookie', 'set-auth-token', 'location', 'cache-control']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ success: false, error: 'Canonical Luth authentication service unavailable.' }, { status: 503 });
  }
}

/** Attach verified identity to a Web Request; caller-supplied identity headers are never trusted. */
export async function authenticateLuthRequest(request: Request): Promise<{ request?: Request; status?: number; error?: string }> {
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith('/api/') || request.method === 'OPTIONS' ||
      pathname === '/health' || pathname === '/api/health' ||
      pathname === '/api/public/routes' || pathname.startsWith('/api/public/routes/')) return { request };
  const guestOnly = hasGuestLeaseCredential(request) &&
    !request.headers.get('authorization') && !stripGuestLeaseCookie(request.headers.get('cookie'));
  if (guestOnly) return { status: 401, error: 'A verified Luth session is required.' };
  if (!request.headers.get('authorization') && !stripGuestLeaseCookie(request.headers.get('cookie'))) {
    return { status: 401, error: 'A verified Luth session is required.' };
  }
  const session = await getLuthSession(request);
  if (!session?.user?.id) return { status: 401, error: 'Luth session is invalid or expired.' };
  const headers = new Headers(request.headers);
  headers.set('x-user-id', session.user.id);
  if (session.user.email) headers.set('x-user-email', String(session.user.email));
  if (session.session?.id) headers.set('x-session-id', session.session.id);
  headers.set('x-user-role', 'user');
  return { request: new Request(request, { headers }) };
}

export async function requireLuthSession(request: Request): Promise<VerifiedLuthSession> {
  const session = await getLuthSession(request);
  if (session) return session;
  throw new Response(JSON.stringify({ error: 'Unauthenticated' }), {
    status: 401,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
