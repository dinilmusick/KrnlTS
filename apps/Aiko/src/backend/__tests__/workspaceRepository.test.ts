/**
 * ASCII Architecture Flowchart: workspaceRepository.test
 *
 *   ┌───────────────────────────────────────┐
 *   │  Initialize workspaceRepository.test  │
 *   └───────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌───────────────────────────────────────┐
 *   │             sampleFeature             │
 *   └───────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌───────────────────────────────────────┐
 *   │               sampleTool              │
 *   └───────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌───────────────────────────────────────┐
 *   │               sampleCred              │
 *   └───────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌───────────────────────────────────────┐
 *   │     Return State / Result Payload     │
 *   └───────────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ IMPORTS & SETUP ═════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { MemoryWorkspaceStorage, LocalWorkspaceStorage } from '../storage/workspaceStorage.js';
import { WorkspaceRepository } from '../storage/workspaceRepository.js';
import { CredentialStore } from '../storage/credentialStore.js';
import { ToolDefinition, FeatureDefinition } from '../types/tools.js';
import { Credential } from '../types/credentials.js';

console.log('════ RUNNING AIKO WORKSPACE REPOSITORY & CREDENTIAL TESTS ════\n');

// ══════════════════════════════════════════════════════════════════════════════════
// ════ MOCK DATA FIXTURES ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

const sampleFeature: FeatureDefinition = {
  schemaVersion: '1.0.0',
  name: 'searchDocs',
  description: 'Search documentation',
  endpoint: { method: 'POST', path: '/docs/search' },
  input: { schema: { type: 'object' }, description: 'Search term' },
  examples: [{ payload: { q: 'aiko' } }],
  output: { schema: { type: 'array' }, description: 'Matching docs', resultMeaning: 'Docs' },
  learnings: [],
  credentialRef: 'my-api-key'
};

const sampleTool: ToolDefinition = {
  schemaVersion: '1.0.0',
  name: 'DocSearch',
  description: 'Doc Search Service',
  type: 'LOCAL',
  endpointBase: { protocol: 'https', domain: 'localhost', port: 3000 },
  features: [sampleFeature],
  learnings: []
};

const sampleCred: Credential = {
  schemaVersion: '1.0.0',
  name: 'my-api-key',
  type: 'API_KEY',
  data: { type: 'API_KEY', apiKey: 'sk-secret-123456789' },
  metadata: { provider: 'Google' }
};

// ══════════════════════════════════════════════════════════════════════════════════
// ════ TEST EXECUTION SUITE ════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

async function runTests() {
  const tmpDir = path.resolve(process.cwd(), '.tmp_test_repo_' + Date.now());

  try {
    const localStorage = new LocalWorkspaceStorage(tmpDir);
    const memStorage = new MemoryWorkspaceStorage();
    const repo = new WorkspaceRepository(localStorage);
    const credStore = new CredentialStore(localStorage);

    console.log('Testing tool persistence...');
    await repo.saveTool('ws-a', sampleTool);

    const featFileExists = await localStorage.exists('ws-a/tools/docsearch/features/searchdocs.json');
    assert.strictEqual(featFileExists, true, 'Feature file should be saved in features subfolder');

    const loadedTool = await repo.getTool('ws-a', 'DocSearch');
    assert.strictEqual(loadedTool.name, 'DocSearch');
    assert.strictEqual(loadedTool.features.length, 1);
    assert.strictEqual(loadedTool.features[0].name, 'searchDocs');

    console.log('Testing feature update and delete...');
    const updatedFeat = { ...sampleFeature, description: 'Updated search description' };
    await repo.updateFeature('ws-a', 'DocSearch', updatedFeat);
    const fetchedFeat = await repo.getFeature('ws-a', 'DocSearch', 'searchDocs');
    assert.strictEqual(fetchedFeat.description, 'Updated search description');

    console.log('Testing collision safety...');
    const collidingTool: ToolDefinition = { ...sampleTool, name: 'DOCSEARCH' };
    await assert.rejects(
      async () => await repo.saveTool('ws-a', collidingTool),
      /Collision error/
    );

    console.log('Testing memory persistence...');
    await repo.saveMemory('ws-a', { schemaVersion: '1.0.0', name: 'proj-notes', content: '1. Note item' });
    const mem = await repo.getMemory('ws-a', 'proj-notes');
    assert.strictEqual(mem.content, '1. Note item');

    console.log('Testing credential store & secret redaction...');
    await credStore.save('ws-a', sampleCred);
    const listRedacted = await credStore.list('ws-a');
    assert.strictEqual((listRedacted[0].data as any).apiKey, '••••••••');

    const fullCred = await credStore.get('ws-a', 'my-api-key');
    assert.strictEqual((fullCred.data as any).apiKey, 'sk-secret-123456789');

    console.log('Testing workspace isolation...');
    await assert.rejects(
      async () => await credStore.get('ws-b', 'my-api-key'),
      /not found in workspace 'ws-b'/
    );

    console.log('Testing credential reference resolution...');
    const resolvedCred = await credStore.resolveFeatureCredential('ws-a', sampleFeature.credentialRef);
    assert.ok(resolvedCred);
    assert.strictEqual((resolvedCred!.data as any).apiKey, 'sk-secret-123456789');

    console.log('\n✅ ALL AIKO WORKSPACE REPOSITORY & CREDENTIAL TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED WITH ERROR:', err);
    process.exit(1);
  } finally {
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

runTests();

assert.strictEqual(true, true);
