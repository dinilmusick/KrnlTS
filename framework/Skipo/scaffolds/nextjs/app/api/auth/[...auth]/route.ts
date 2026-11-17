import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LUTH_URL } from '@ultrst-armada/kloks/auth';

/** Catch-all compatibility proxy. No authentication logic may live in the application. */
async function proxy(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname + req.nextUrl.search;
    const headers = new Headers();
    for (const name of ['authorization', 'cookie', 'content-type', 'origin', 'user-agent']) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('x-app-id', 'my-app');
    const init: RequestInit = {
      method: req.method,
      headers,
      redirect: 'manual',
      cache: 'no-store',
    };
    if (!['GET', 'HEAD'].includes(req.method)) init.body = await req.text();
    const upstream = await fetch(`${DEFAULT_LUTH_URL}${path}`, init);
    const responseHeaders = new Headers();
    for (const name of ['content-type', 'set-cookie', 'set-auth-token', 'location', 'cache-control']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Canonical Luth authentication service unavailable.' },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
