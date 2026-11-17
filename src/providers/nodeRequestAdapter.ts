import { Buffer } from 'node:buffer';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

export type FetchHandler = (request: Request, env?: Record<string, unknown>) => Promise<Response>;

export async function dispatchNodeRequest(
  incoming: IncomingMessage,
  outgoing: ServerResponse,
  handler: FetchHandler,
  env: Record<string, unknown> = process.env,
): Promise<void> {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (value === undefined) continue;
      headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }

    const protocol = headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    const host = headers.get('host') || 'localhost';
    const url = new URL(incoming.url || '/', `${protocol}://${host}`);
    const method = (incoming.method || 'GET').toUpperCase();
    const init: RequestInit & { duplex?: 'half' } = { method, headers };

    if (method !== 'GET' && method !== 'HEAD') {
      init.body = Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
      init.duplex = 'half';
    }

    const request = new Request(url, init);
    const response = await handler(request, env);
    outgoing.statusCode = response.status;
    response.headers.forEach((value, name) => outgoing.setHeader(name, value));
    const bytes = new Uint8Array(await response.arrayBuffer());
    outgoing.end(Buffer.from(bytes));
  } catch (error) {
    outgoing.statusCode = 500;
    outgoing.setHeader('content-type', 'application/json; charset=utf-8');
    outgoing.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
}

export default dispatchNodeRequest;
