/**
 * Fetch-native service adapter for serverless and edge runtimes.
 * The host platform supplies Request objects and owns the server lifecycle.
 */
import type { ProtocolAdapter, ProtocolCapabilities, ProtocolEnvelope } from './ProtocolAdapter.js';
import type { EndpointDescriptor, IService } from '../services/ServiceContract.js';

export interface FetchProtocolAdapterOptions {
  /** Optional URL path prefix owned by this service, e.g. "/api/krnl". */
  basePath?: string;
}

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class FetchProtocolAdapter implements ProtocolAdapter {
  readonly protocol = 'http' as const;
  readonly capabilities: ProtocolCapabilities = {
    requestResponse: true,
    streaming: false,
    pubSub: false,
    datagram: false,
    peerToPeer: false,
    signaling: false,
    discovery: false,
  };

  private readonly basePath: string;

  constructor(options: FetchProtocolAdapterOptions = {}) {
    const value = options.basePath?.trim() ?? '';
    this.basePath = value && value !== '/'
      ? '/' + value.split('/').filter(Boolean).join('/')
      : '';
  }

  /** Create a standard Fetch handler suitable for Workers, Vercel and Cloud Run. */
  createHandler(service: IService): (request: Request) => Promise<Response> {
    return (request) => this.handle(request, service);
  }

  /** Route a single standard Fetch Request to the supplied service. */
  async handle(request: Request, service: IService): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (this.basePath && pathname !== this.basePath && !pathname.startsWith(this.basePath + '/')) {
      return jsonResponse({ error: 'Route not found' }, 404);
    }
    const route = this.basePath ? pathname.slice(this.basePath.length) || '/' : pathname;

    if (route === '/health') {
      if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, { allow: 'GET' });
      return jsonResponse({ status: 'ok', service: service.name });
    }
    if (route === '/manifest') {
      if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, { allow: 'GET' });
      return jsonResponse(service.getDefinition());
    }

    const callMatch = route.match(/^\/call\/([^/]+)$/);
    if (!callMatch) return jsonResponse({ error: 'Route not found' }, 404);
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, { allow: 'POST' });

    let operation: string;
    try {
      operation = decodeURIComponent(callMatch[1]);
    } catch {
      return jsonResponse({ error: 'Invalid operation path encoding' }, 400);
    }

    let input: unknown = {};
    const rawBody = await request.text();
    if (rawBody.trim()) {
      try {
        input = JSON.parse(rawBody);
      } catch {
        return jsonResponse({ error: 'Request body must contain valid JSON' }, 400);
      }
    }

    try {
      const payload = await service.call(operation, input, {
        protocol: 'http',
        correlationId: request.headers.get('x-correlation-id') ?? undefined,
      });
      return jsonResponse({ status: 'success', payload });
    } catch (error) {
      return jsonResponse({ status: 'error', error: errorMessage(error) }, 500);
    }
  }

  /** Send an operation through the standard Fetch API to another handler. */
  async send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope> {
    const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(endpoint.address);
    const host = endpoint.address.split(':').length > 2 && !endpoint.address.startsWith('[')
      ? '[' + endpoint.address + ']'
      : endpoint.address;
    const url = new URL(hasScheme ? endpoint.address : 'http://' + host);
    if (endpoint.port && !url.port) url.port = String(endpoint.port);
    const pathParts = [
      url.pathname.replace(/^\/+|\/+$/g, ''),
      (endpoint.path ?? '').replace(/^\/+|\/+$/g, ''),
      'call',
      encodeURIComponent(envelope.operation ?? ''),
    ].filter(Boolean);
    url.pathname = '/' + pathParts.join('/');
    url.search = '';
    url.hash = '';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(envelope.id ? { 'x-correlation-id': envelope.id } : {}),
      },
      body: JSON.stringify(envelope.payload ?? {}),
    });

    let body: { payload?: unknown; error?: string } = {};
    try {
      body = await response.json() as { payload?: unknown; error?: string };
    } catch {
      body = {};
    }
    return {
      id: 'res-' + Date.now(),
      type: 'response',
      correlationId: envelope.id,
      payload: body.payload,
      error: body.error ?? (response.ok ? undefined : 'HTTP ' + response.status),
      timestamp: Date.now(),
    };
  }
}
