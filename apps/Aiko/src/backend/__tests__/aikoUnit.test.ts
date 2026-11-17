/**
 * ASCII Architecture Flowchart: aikoUnit.test
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize aikoUnit.test     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          sampleFeature           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            localTool             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            remoteTool            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO COMMUNICATION PRIMITIVE UNIT TESTS ══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { resolveEndpointUrl, containsSecretInUrl } from '../aiko/urlResolver.js';
import { buildCredentialHeaders, redactSanitizedHeaders } from '../aiko/credentialHeaders.js';
import { validatePayload } from '../aiko/payloadValidator.js';
import { ToolDefinition, FeatureDefinition } from '../types/tools.js';
import { Credential } from '../types/credentials.js';

console.log('════ RUNNING AIKO UNIT TESTS ════\n');

const sampleFeature: FeatureDefinition = {
  schemaVersion: '1.0.0',
  name: 'testFeature',
  description: 'Test feature',
  endpoint: { method: 'GET', path: '/api/v1/test' },
  input: {
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        count: { type: 'number' }
      },
      required: ['query']
    },
    description: 'Input'
  },
  examples: [],
  output: { schema: { type: 'object' }, description: 'Output', resultMeaning: 'Success' },
  learnings: []
};

const localTool: ToolDefinition = {
  schemaVersion: '1.0.0',
  name: 'LocalTool',
  description: 'Local tool',
  type: 'LOCAL',
  endpointBase: { protocol: 'https', domain: 'localhost', port: 3000 },
  features: [sampleFeature],
  learnings: []
};

const remoteTool: ToolDefinition = {
  schemaVersion: '1.0.0',
  name: 'RemoteTool',
  description: 'Remote tool',
  type: 'REMOTE',
  endpointBase: { protocol: 'https', domain: 'api.example.com' },
  features: [sampleFeature],
  learnings: []
};

try {
  console.log('1. Testing URL construction & local port substitution...');
  const localUrl = resolveEndpointUrl(localTool, sampleFeature);
  assert.strictEqual(localUrl, 'https://localhost:3000/api/v1/test');

  console.log('2. Testing remote domain resolution...');
  const remoteUrl = resolveEndpointUrl(remoteTool, sampleFeature);
  assert.strictEqual(remoteUrl, 'https://api.example.com/api/v1/test');

  console.log('3. Testing query encoding...');
  const queryUrl = resolveEndpointUrl(localTool, sampleFeature, { search: 'hello world', page: 2 });
  assert.strictEqual(queryUrl, 'https://localhost:3000/api/v1/test?search=hello+world&page=2');

  console.log('4. Testing authentication injection for API_KEY...');
  const apiKeyCred: Credential = {
    schemaVersion: '1.0.0',
    name: 'apiKeyCred',
    type: 'API_KEY',
    data: { type: 'API_KEY', apiKey: 'secret-key-123' }
  };
  const apiKeyHeaders = buildCredentialHeaders(apiKeyCred);
  assert.strictEqual(apiKeyHeaders['X-API-Key'], 'secret-key-123');

  console.log('5. Testing authentication injection for BEARER_TOKEN & BASIC_AUTH...');
  const bearerCred: Credential = {
    schemaVersion: '1.0.0',
    name: 'bearerCred',
    type: 'BEARER_TOKEN',
    data: { type: 'BEARER_TOKEN', token: 'bearer-token-abc' }
  };
  const bearerHeaders = buildCredentialHeaders(bearerCred);
  assert.strictEqual(bearerHeaders['Authorization'], 'Bearer bearer-token-abc');

  const basicCred: Credential = {
    schemaVersion: '1.0.0',
    name: 'basicCred',
    type: 'BASIC_AUTH',
    data: { type: 'BASIC_AUTH', username: 'admin', password: 'secretpassword' }
  };
  const basicHeaders = buildCredentialHeaders(basicCred);
  assert.ok(basicHeaders['Authorization'].startsWith('Basic '));

  console.log('6. Testing credential redaction...');
  const redactedHeaders = redactSanitizedHeaders({
    'Authorization': 'Bearer secret-token-123',
    'X-API-Key': 'my-secret-key',
    'Content-Type': 'application/json'
  });
  assert.strictEqual(redactedHeaders['authorization'], '[REDACTED_SECRET]');
  assert.strictEqual(redactedHeaders['x-api-key'], '[REDACTED_SECRET]');
  assert.strictEqual(redactedHeaders['content-type'], 'application/json');

  console.log('7. Testing payload schema validation...');
  const validPayloadRes = validatePayload(sampleFeature.input.schema, { query: 'search text', count: 5 });
  assert.strictEqual(validPayloadRes.valid, true);

  const invalidPayloadRes = validatePayload(sampleFeature.input.schema, { count: 'not-a-number' });
  assert.strictEqual(invalidPayloadRes.valid, false);
  assert.ok(invalidPayloadRes.errors.some(e => e.includes("Required property 'query' is missing")));

  console.log('✅ ALL AIKO UNIT TESTS PASSED SUCCESSFULLY!\n');
} catch (err) {
  console.error('❌ AIKO UNIT TESTS FAILED:');
  console.error(err);
  process.exit(1);
}

assert.strictEqual(true, true);