import { NextRequest, NextResponse } from 'next/server';
import { getLuthSession } from './src/backend/auth/luthSession';

const PUBLIC_PATHS = new Set(['/api/health', '/api/public/routes']);

function isLuthAuthEndpoint(pathname: string): boolean {
  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) {
    return !pathname.startsWith('/api/auth/workspaces')
      && !pathname.startsWith('/api/auth/storage/');
  }
  return false;
}

/** Verify protected app APIs against Luth and replace caller-supplied identity headers. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.method === 'OPTIONS' || PUBLIC_PATHS.has(pathname) || isLuthAuthEndpoint(pathname)) {
    return NextResponse.next();
  }

  const session = await getLuthSession(request);
  if (!session) {
    return NextResponse.json({ error: 'A valid Luth session is required.' }, { status: 401 });
  }

  const forwarded = new Headers(request.headers);
  forwarded.set('x-user-id', session.user.id);
  if (typeof session.user.email === 'string') forwarded.set('x-user-email', session.user.email);
  forwarded.set('x-user-role', 'user');
  return NextResponse.next({ request: { headers: forwarded } });
}

export const config = {
  matcher: ['/api/:path*'],
};
