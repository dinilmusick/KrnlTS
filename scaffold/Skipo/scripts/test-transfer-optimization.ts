import { sanitizeStorageKey } from '../lib/storage/presigner';
import { applyWorkspaceMutations, getWorkspaceRevision } from '../lib/mutations/mutation-applier';
import { MutationQueue } from '../lib/client/MutationQueue';
import { RequestDeduplicator } from '../lib/client/RequestDeduplicator';
import { WorkspaceCache } from '../lib/client/WorkspaceCache';

async function runTests() {
  console.log('🧪 Starting Vercel Processing & Transfer Optimization Test Suite...\n');

  // Test 1: Storage Key Sanitization
  const key = sanitizeStorageKey('ws_alpha_123', 'documents/doc-01/readme.md');
  if (key !== 'workspaces/ws_alpha_123/documents/doc-01/readme.md') {
    throw new Error(`Test 1 Failed: Unexpected key ${key}`);
  }
  console.log('✅ Test 1: B2 Storage Key Sanitization Passed');

  // Test 2: Mutation Applier & Revision Incrementation
  const initialRev = getWorkspaceRevision('ws-test');
  const res = await applyWorkspaceMutations('ws-test', initialRev, [
    {
      mutationId: 'm-1',
      entity: 'node',
      entityId: 'node-alpha',
      operation: 'update',
      patch: { title: 'Updated Alpha Node' },
      baseRevision: initialRev,
      clientTimestamp: Date.now(),
    },
  ]);

  if (!res.success || res.newRevision !== initialRev + 1) {
    throw new Error(`Test 2 Failed: Revision not incremented properly (got ${res.newRevision})`);
  }
  console.log(`✅ Test 2: Granular Mutation & Concurrency Passed (Rev ${initialRev} -> ${res.newRevision})`);

  // Test 3: Concurrency Conflict Detection
  const conflictRes = await applyWorkspaceMutations('ws-test', initialRev, [
    {
      mutationId: 'm-2',
      entity: 'node',
      entityId: 'node-alpha',
      operation: 'move',
      patch: { x: 100, y: 200 },
      baseRevision: initialRev, // Stale revision
      clientTimestamp: Date.now(),
    },
  ]);

  if (conflictRes.success || !conflictRes.conflict) {
    throw new Error('Test 3 Failed: Expected concurrency conflict was not caught');
  }
  console.log('✅ Test 3: Stale Base Revision Conflict Rejection Passed');

  // Test 4: Client MutationQueue Collapsing
  let flushedCount = 0;
  const queue = new MutationQueue(async (mutations) => {
    flushedCount = mutations.length;
    return { success: true, newRevision: 2, appliedMutationIds: [], affectedEntities: [] };
  }, 100);

  // Send 4 rapid moves on the same node
  queue.enqueue({ mutationId: '1', entity: 'node', entityId: 'node-A', operation: 'move', patch: { x: 10 }, baseRevision: 1, clientTimestamp: 1 });
  queue.enqueue({ mutationId: '2', entity: 'node', entityId: 'node-A', operation: 'move', patch: { x: 20 }, baseRevision: 1, clientTimestamp: 2 });
  queue.enqueue({ mutationId: '3', entity: 'node', entityId: 'node-A', operation: 'move', patch: { x: 30 }, baseRevision: 1, clientTimestamp: 3 });
  queue.enqueue({ mutationId: '4', entity: 'node', entityId: 'node-A', operation: 'move', patch: { x: 40 }, baseRevision: 1, clientTimestamp: 4 });

  await queue.flush();
  if (flushedCount !== 1) {
    throw new Error(`Test 4 Failed: Expected 1 collapsed mutation, got ${flushedCount}`);
  }
  console.log('✅ Test 4: Client MutationQueue Superseded Collapsing Passed');

  // Test 5: Request Deduplication
  const deduplicator = new RequestDeduplicator();
  let executedCalls = 0;
  const mockFetch = async () => {
    executedCalls++;
    await new Promise((r) => setTimeout(r, 20));
    return { data: 'ok' };
  };

  const [r1, r2, r3] = await Promise.all([
    deduplicator.dedupe('req-1', mockFetch),
    deduplicator.dedupe('req-1', mockFetch),
    deduplicator.dedupe('req-1', mockFetch),
  ]);

  if (executedCalls !== 1 || r1.data !== 'ok' || r2.data !== 'ok') {
    throw new Error(`Test 5 Failed: Expected 1 fetch execution, got ${executedCalls}`);
  }
  console.log('✅ Test 5: Concurrent Request Deduplication Passed');

  // Test 6: Workspace Cache
  const cache = new WorkspaceCache(1000);
  cache.set('meta-1', { name: 'Vault' }, 1);
  const cached = cache.get<{ name: string }>('meta-1');
  if (!cached || cached.name !== 'Vault') {
    throw new Error('Test 6 Failed: Cache entry retrieval failed');
  }
  console.log('✅ Test 6: Client Workspace Cache Passed');

  console.log('\n🎉 ALL OPTIMIZATION ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
