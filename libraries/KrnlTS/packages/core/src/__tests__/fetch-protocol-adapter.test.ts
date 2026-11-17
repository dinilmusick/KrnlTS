import { describe, expect, it, vi } from 'vitest';
import type { IService } from '../services/ServiceContract.js';
import { FetchProtocolAdapter } from '../protocols/FetchProtocolAdapter.js';

function makeService() {
  const definition = {
    id: 'fetch-service',
    name: 'Fetch Service',
    version: '1.0.0',
    operations: { echo: { id: 'echo', name: 'Echo' } },
  };
  const call = vi.fn(async (operation: string, input?: unknown) => {
    if (operation !== 'echo') throw new Error('Unknown operation: ' + operation);
    return { echoed: input };
  });
  const service = {
    id: definition.id,
    name: definition.name,
    version: definition.version,
    call,
    getDefinition: () => definition,
  } as unknown as IService;
  return { service, call, definition };
}

describe('FetchProtocolAdapter', () => {
  it('serves health and manifest routes using standard Fetch APIs', async () => {
    const { service, definition } = makeService();
    const handler = new FetchProtocolAdapter().createHandler(service);
    const health = await handler(new Request('https://worker.example/health'));
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: 'ok', service: 'Fetch Service' });
    const manifest = await handler(new Request('https://worker.example/manifest'));
    expect(manifest.status).toBe(200);
    expect(await manifest.json()).toEqual(definition);
  });

  it('dispatches operation requests and forwards the correlation id', async () => {
    const { service, call } = makeService();
    const handler = new FetchProtocolAdapter({ basePath: '/api/krnl' }).createHandler(service);
    const response = await handler(new Request('https://worker.example/api/krnl/call/echo', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-correlation-id': 'trace-1' },
      body: JSON.stringify({ value: 42 }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'success', payload: { echoed: { value: 42 } } });
    expect(call).toHaveBeenCalledWith('echo', { value: 42 }, { protocol: 'http', correlationId: 'trace-1' });
  });

  it('rejects malformed JSON, unsupported methods and unknown routes', async () => {
    const { service } = makeService();
    const handler = new FetchProtocolAdapter().createHandler(service);
    const malformed = await handler(new Request('https://worker.example/call/echo', { method: 'POST', body: '{' }));
    expect(malformed.status).toBe(400);
    const wrongMethod = await handler(new Request('https://worker.example/call/echo'));
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get('allow')).toBe('POST');
    const missing = await handler(new Request('https://worker.example/not-found'));
    expect(missing.status).toBe(404);
  });

  it('does not claim routes outside its configured base path', async () => {
    const { service } = makeService();
    const handler = new FetchProtocolAdapter({ basePath: '/api/krnl' }).createHandler(service);
    const response = await handler(new Request('https://worker.example/api/other/health'));
    expect(response.status).toBe(404);
  });

  it('sends requests to a remote Fetch handler', async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ status: 'success', payload: { echoed: true } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const adapter = new FetchProtocolAdapter();
      const response = await adapter.send(
        { protocol: 'http', address: 'https://api.example.test', path: '/api/krnl', capabilities: [] },
        { id: 'request-1', type: 'request', operation: 'echo', payload: { ok: true }, timestamp: 1 },
      );
      expect(response.type).toBe('response');
      expect(response.correlationId).toBe('request-1');
      expect(response.payload).toEqual({ echoed: true });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
      expect(url.toString()).toBe('https://api.example.test/api/krnl/call/echo');
      expect(init.method).toBe('POST');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('accepts host and port endpoint descriptors from Node HTTP transports', async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ status: 'success', payload: { echoed: true } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const adapter = new FetchProtocolAdapter();
      await adapter.send(
        { protocol: 'http', address: '127.0.0.1', port: 8787, capabilities: [] },
        { id: 'request-2', type: 'request', operation: 'echo', payload: { ok: true }, timestamp: 2 },
      );
      const [url] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
      expect(url.toString()).toBe('http://127.0.0.1:8787/call/echo');
    } finally {
      vi.unstubAllGlobals();
    }
  });

});
