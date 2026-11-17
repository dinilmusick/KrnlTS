/**
 * ASCII Architecture Flowchart: aikoHttpClient.test
 *
 *   ┌──────────────────────────────────┐
 *   │  Initialize aikoHttpClient.test  │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           testFeature            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             testTool             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             runTests             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO HTTP CLIENT & EXECUTOR INTEGRATION TESTS ════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { AikoHttpClient } from '../aiko/AikoHttpClient.js';
import { DeterministicEndpointExecutor } from '../aiko/DeterministicEndpointExecutor.js';
import { HttpClientError } from '../aiko/types.js';
import { ToolDefinition, FeatureDefinition } from '../types/tools.js';

console.log('════ RUNNING AIKO HTTP CLIENT & EXECUTOR TESTS ════\n');

const testFeature: FeatureDefinition = {
  schemaVersion: '1.0.0',
  name: 'fetchData',
  description: 'Fetches sample data',
  endpoint: { method: 'POST', path: '/api/data' },
  input: {
    schema: {
      type: 'object',
      properties: { item: { type: 'string' } },
      required: ['item']
    },
    description: 'Data item'
  },
  examples: [],
  output: { schema: { type: 'object' }, description: 'Output', resultMeaning: 'Success' },
  learnings: []
};

const testTool: ToolDefinition = {
  schemaVersion: '1.0.0',
  name: 'TestTool',
  description: 'Test Tool',
  type: 'LOCAL',
  endpointBase: { protocol: 'https', domain: 'example.com' },
  features: [testFeature],
  learnings: []
};

async function runTests() {
  console.log('1. Testing successful JSON request and response parsing...');
  const mockSuccessFetch: typeof fetch = async () => {
    return new Response(JSON.stringify({ result: 'success', value: 42 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const client = new AikoHttpClient({ customFetch: mockSuccessFetch });
  const res = await client.post('https://example.com/api/data', { item: 'test' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.ok, true);
  assert.deepStrictEqual(res.body, { result: 'success', value: 42 });

  console.log('2. Testing 4xx / 5xx HTTP error throwing and header redaction...');
  const mock404Fetch: typeof fetch = async () => {
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer secret' }
    });
  };

  const errClient = new AikoHttpClient({ customFetch: mock404Fetch });
  await assert.rejects(
    async () => errClient.get('https://example.com/api/data'),
    (err: any) => {
      assert.ok(err instanceof HttpClientError);
      assert.strictEqual(err.kind, 'HTTP');
      assert.strictEqual(err.status, 404);
      assert.strictEqual(err.response?.headers['authorization'], '[REDACTED_SECRET]');
      return true;
    }
  );

  console.log('3. Testing malformed JSON PARSE error handling...');
  const mockBadJsonFetch: typeof fetch = async () => {
    return new Response('{ malformed json }', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const parseClient = new AikoHttpClient({ customFetch: mockBadJsonFetch });
  await assert.rejects(
    async () => parseClient.get('https://example.com/api/data'),
    (err: any) => {
      assert.ok(err instanceof HttpClientError);
      assert.strictEqual(err.kind, 'PARSE');
      assert.strictEqual(err.response?.body, '{ malformed json }');
      return true;
    }
  );

  console.log('4. Testing TIMEOUT error handling...');
  const mockSlowFetch: typeof fetch = async (_url, init) => {
    return new Promise<Response>((_resolve, reject) => {
      if (init?.signal) {
        init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }
    });
  };

  const timeoutClient = new AikoHttpClient({ defaultTimeoutMs: 50, customFetch: mockSlowFetch });
  await assert.rejects(
    async () => timeoutClient.get('https://example.com/api/data'),
    (err: any) => {
      assert.ok(err instanceof HttpClientError);
      assert.strictEqual(err.kind, 'TIMEOUT');
      return true;
    }
  );

  console.log('5. Testing AbortSignal ABORTED cancellation error handling...');
  const abortController = new AbortController();
  abortController.abort();
  const abortClient = new AikoHttpClient({ customFetch: mockSuccessFetch });
  await assert.rejects(
    async () => abortClient.get('https://example.com/api/data', undefined, undefined, { signal: abortController.signal }),
    (err: any) => {
      assert.ok(err instanceof HttpClientError);
      assert.strictEqual(err.kind, 'ABORTED');
      return true;
    }
  );

  console.log('6. Testing INVALID_URL error handling...');
  const urlClient = new AikoHttpClient({ customFetch: mockSuccessFetch });
  await assert.rejects(
    async () => urlClient.get('not-a-valid-url'),
    (err: any) => {
      assert.ok(err instanceof HttpClientError);
      assert.strictEqual(err.kind, 'INVALID_URL');
      return true;
    }
  );

  console.log('7. Testing DeterministicEndpointExecutor end-to-end pipeline...');
  const executor = new DeterministicEndpointExecutor(undefined, { customFetch: mockSuccessFetch });
  const execRes = await executor.execute('default', testTool, testFeature, { item: 'valid-item' });
  assert.strictEqual(execRes.status, 200);
  assert.deepStrictEqual(execRes.body, { result: 'success', value: 42 });

  console.log('✅ ALL AIKO HTTP CLIENT & EXECUTOR TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ AIKO HTTP CLIENT TESTS FAILED:');
  console.error(err);
  process.exit(1);
});

assert.strictEqual(true, true);
