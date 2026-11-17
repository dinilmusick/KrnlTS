import test from 'node:test';
import assert from 'node:assert/strict';
import { CredentialStore } from '../storage/credentialStore.js';
import { MemoryWorkspaceStorage } from '../storage/workspaceStorage.js';
import { RuntimeProviderError } from './errors.js';
import { RuntimeAccountService } from './RuntimeAccountService.js';
import { RuntimeNodeAdapter } from './RuntimeNodeAdapter.js';
import { RuntimeProviderRegistry } from './RuntimeProviderRegistry.js';
import { deserializeRuntimeHandle, serializeRuntimeHandle } from './security.js';
import { RuntimeService } from './RuntimeService.js';
import type { RuntimeProvider, RuntimeProviderContext, RuntimeProviderResource } from './types.js';

function setup() {
  const storage = new MemoryWorkspaceStorage(); const registry = new RuntimeProviderRegistry();
  const accounts = new RuntimeAccountService(storage); let terminations = 0;
  const provider: RuntimeProvider = {
    id: 'mock-cloud', displayName: 'Mock Cloud', description: 'In-memory provider for tests.', capabilities: ['exec', 'persistent', 'http'],
    validateConfiguration: config => typeof config.region === 'string' ? [] : ['region is required'],
    describeConfiguration: config => ({ kind: 'mock-machine', details: { region: config.region } }),
    async spawn(request, _context: RuntimeProviderContext): Promise<RuntimeProviderResource> {
      return { providerRuntimeId: 'provider-runtime-1', lifecycle: 'ready', capabilities: ['exec', 'persistent', 'http'],
        access: { api: { kind: 'api', endpoint: 'https://runtime.mock/api' }, ssh: { kind: 'ssh', endpoint: 'ssh://runtime.mock' } },
        resource: { kind: 'mock-machine', details: { shape: request.configuration.shape || 'small', region: request.configuration.region } } };
    },
    async status() { return 'ready'; },
    async execute(_handle, request) { return { exitCode: 0, stdout: 'ran: ' + request.command, stderr: '', durationMs: 2 }; },
    async terminate() { terminations++; },
  };
  registry.register(provider);
  return { storage, registry, accounts, runtimes: new RuntimeService(registry, accounts, storage), provider, terminations: () => terminations };
}
const runtimeContext = (extra: Record<string, unknown> = {}) => ({ workspaceId: 'ws-1', executionId: 'graph-1', principal: { id: 'luth-user-1', role: 'user' }, auth: { provider: 'luth' as const, verified: true as const }, ...extra });
async function addAccount(env: ReturnType<typeof setup>, id: string, capabilities?: ('exec' | 'persistent' | 'http')[]) {
  const credentials = new CredentialStore(env.storage);
  await credentials.save('ws-1', { schemaVersion: '1.0.0', name: 'runtime-cred-' + id, type: 'API_KEY', data: { type: 'API_KEY', apiKey: 'test-secret-value' } });
  return env.runtimes.saveAccount('ws-1', { id, providerId: 'mock-cloud', displayName: id, credentialRef: 'runtime-cred-' + id, capabilities });
}
test('provider registration, lookup, capabilities, and multiple accounts are explicit', async () => {
  const env = setup();
  assert.equal(env.registry.get('mock-cloud').displayName, 'Mock Cloud');
  assert.deepEqual(env.registry.capabilities('mock-cloud'), ['exec', 'persistent', 'http']);
  await addAccount(env, 'account-a'); await addAccount(env, 'account-b');
  assert.equal((await env.accounts.list('ws-1')).length, 2);
  assert.throws(() => env.registry.get('missing'), error => error instanceof RuntimeProviderError && error.code === 'PROVIDER_UNAVAILABLE');
});
test('spawn validates provider configuration and persists only a safe persistent handle', async () => {
  const env = setup(); await addAccount(env, 'account-a');
  await assert.rejects(() => env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: {}, persistence: 'persistent' }), error => error instanceof RuntimeProviderError && error.code === 'INVALID_CONFIGURATION');
  const handle = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'persistent', executionId: 'exec-1' });
  assert.equal(handle.providerRuntimeId, 'provider-runtime-1');
  assert.equal('api' in handle.access, true);
  assert.equal('ssh' in handle.access, false);
  assert.deepEqual((await env.runtimes.get('ws-1', handle.id)).resource.details, { shape: 'small', region: 'test-1' });
  const stored = await env.storage.read('ws-1/runtime-handles/index.json');
  assert.equal(stored.includes('test-secret-value'), false); assert.equal(stored.includes('runtime-cred-account-a'), false);
});
test('provider allocation is rolled back when metadata contains credential material', async () => {
  const env = setup(); await addAccount(env, 'account-a');
  let terminated = 0;
  env.provider.spawn = async () => ({
    providerRuntimeId: 'unsafe-runtime', lifecycle: 'ready', capabilities: ['exec', 'persistent', 'http'],
    access: { api: { kind: 'api', endpoint: 'https://runtime.mock/api' } },
    resource: { kind: 'unsafe', details: { description: 'test-secret-value' } },
  });
  env.provider.terminate = async () => { terminated++; };
  await assert.rejects(() => env.runtimes.spawn({
    workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a',
    configuration: { region: 'test-1' }, persistence: 'persistent',
  }), error => error instanceof RuntimeProviderError && error.code === 'SECRET_LEAK_PREVENTED');
  assert.equal(terminated, 1);
});

test('provider command output redacts credential material', async () => {
  const env = setup(); await addAccount(env, 'account-a');
  env.provider.execute = async () => ({
    exitCode: 0, stdout: 'token=test-secret-value', stderr: '', metadata: { rawToken: 'test-secret-value' },
  });
  const handle = await env.runtimes.spawn({
    workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a',
    configuration: { region: 'test-1' }, persistence: 'persistent',
  });
  const result = await env.runtimes.execute('ws-1', handle.id, { command: 'echo safe' });
  assert.equal(result.result.stdout.includes('test-secret-value'), false);
  assert.equal(result.result.metadata?.rawToken, '[REDACTED]');
});

test('runtime handles serialize safely and reject secret-bearing provider metadata', async () => {
  const env = setup(); await addAccount(env, 'account-a');
  const handle = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'persistent' });
  assert.deepEqual(deserializeRuntimeHandle(serializeRuntimeHandle(handle)), handle);
  assert.throws(() => serializeRuntimeHandle({ ...handle, resource: { kind: 'leak', details: { accessToken: 'must-not-serialize' } } }), error => error instanceof RuntimeProviderError && error.code === 'SECRET_LEAK_PREVENTED');
  assert.throws(() => serializeRuntimeHandle({ ...handle, ...({ credentialRef: 'should-not-be-in-handle' } as any) }), error => error instanceof RuntimeProviderError && error.code === 'SECRET_LEAK_PREVENTED');
  assert.throws(() => serializeRuntimeHandle({ ...handle, access: { api: { kind: 'api', endpoint: 'https://user:pass@host' } } }), error => error instanceof RuntimeProviderError && error.code === 'SECRET_LEAK_PREVENTED');
});
test('execute is capability-gated and persistent handles update lifecycle through status and termination', async () => {
  const env = setup(); await addAccount(env, 'account-a');
  const handle = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'persistent' });
  const command = await env.runtimes.execute('ws-1', handle.id, { command: 'npm test' });
  assert.equal(command.result.stdout, 'ran: npm test');
  assert.equal((await env.runtimes.status('ws-1', handle.id)).lifecycle, 'ready');
  assert.equal((await env.runtimes.terminate('ws-1', handle.id)).lifecycle, 'terminated');
  assert.equal(env.terminations(), 1);
  await assert.rejects(() => env.runtimes.execute('ws-1', handle.id, { command: 'echo nope' }), error => error instanceof RuntimeProviderError && error.code === 'RUNTIME_TERMINATED');
});
test('account capability grants further restrict provider capabilities', async () => {
  const env = setup(); await addAccount(env, 'account-no-exec', ['persistent']);
  const handle = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-no-exec', configuration: { region: 'test-1' }, persistence: 'persistent' });
  await assert.rejects(() => env.runtimes.execute('ws-1', handle.id, { command: 'npm test' }), error => error instanceof RuntimeProviderError && error.code === 'CAPABILITY_UNSUPPORTED');
});
test('transient handles persist safe references and cleanup targets only the matching execution across instances', async () => {
  const env = setup(); await addAccount(env, 'account-a');
  const one = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'transient', executionId: 'exec-a' });
  await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'transient', executionId: 'exec-b' });
  assert.equal(await env.storage.exists('ws-1/runtime-handles/index.json'), true);
  const stored = await env.storage.read('ws-1/runtime-handles/index.json');
  assert.equal(stored.includes('test-secret-value'), false);
  assert.equal(stored.includes(one.id), true);
  // Simulate a request landing on another Aiko instance with the same workspace store.
  const otherInstance = new RuntimeService(env.registry, env.accounts, env.storage);
  assert.deepEqual(await otherInstance.cleanupTransient('ws-1', 'exec-a'), [{ handleId: one.id, success: true }]);
  assert.equal(env.terminations(), 1);
});
test('workflow node adapter passes safe handles directly without an HTTP round trip', async () => {
  const env = setup(); await addAccount(env, 'account-a'); const adapter = new RuntimeNodeAdapter(env.runtimes);
  assert.equal(adapter.definitions().some(item => item.type === 'runtime/spawn'), true);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error('Aiko runtime nodes must not issue HTTP requests'); }) as typeof fetch;
  try {
    const spawned = await adapter.execute('runtime/spawn', { providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'persistent' }, runtimeContext());
    const executed = await adapter.execute('runtime/execute', { runtime: spawned.runtime, command: 'npm run lint' }, runtimeContext());
    assert.equal((executed.result as any).stdout, 'ran: npm run lint');
    assert.equal(JSON.stringify({ spawned, executed }).includes('credentialRef'), false);
    assert.equal(JSON.stringify({ spawned, executed }).includes('test-secret-value'), false);
  } finally { globalThis.fetch = oldFetch; }
});
test('provider failures remain structured and inline workflow secrets are rejected', async () => {
  const env = setup(); await addAccount(env, 'account-a');
  await assert.rejects(() => env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, injectedInputs: { API_TOKEN: 'not-allowed' }, persistence: 'persistent' }), error => error instanceof RuntimeProviderError && error.code === 'SECRET_LEAK_PREVENTED');
  env.provider.execute = async () => { throw new RuntimeProviderError('QUOTA_EXHAUSTED', 'Test quota exhausted.'); };
  const handle = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'persistent' });
  await assert.rejects(() => env.runtimes.execute('ws-1', handle.id, { command: 'npm test' }), error => error instanceof RuntimeProviderError && error.code === 'QUOTA_EXHAUSTED');
});

test('runtime adapter enforces verified Luth context and workspace-owned handles', async () => {
  const env = setup(); await addAccount(env, 'account-a'); const adapter = new RuntimeNodeAdapter(env.runtimes);
  const rejected = await adapter.execute('runtime/spawn', { providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' } }, { workspaceId: 'ws-1', executionId: 'graph-1' } as any);
  assert.equal((rejected.error as any).code, 'INVALID_HANDLE');
  const crossWorkspace = await adapter.execute('runtime/execute', { runtime: { id: 'runtime-x', workspaceId: 'ws-2' }, command: 'whoami' }, runtimeContext());
  assert.equal((crossWorkspace.error as any).code, 'INVALID_HANDLE');
});
test('provider-specific nodes delegate through registered providers and mark unsupported providers unavailable', async () => {
  const env = setup(); await addAccount(env, 'account-a'); const adapter = new RuntimeNodeAdapter(env.runtimes);
  const definitions = adapter.definitions();
  assert.equal(definitions.find(item => item.type === 'runtime/fly-io')?.available, false);
  const result = await adapter.execute('runtime/fly-io', { accountId: 'account-a', command: 'echo no' }, runtimeContext());
  assert.equal((result.error as any).code, 'PROVIDER_UNAVAILABLE');
});
test('execution cleanup is scoped and preserves persistent runtime handles', async () => {
  const env = setup(); await addAccount(env, 'account-a'); const adapter = new RuntimeNodeAdapter(env.runtimes);
  const transient = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'transient', executionId: 'graph-clean' });
  const persistent = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'persistent', executionId: 'graph-clean' });
  const cancelled = new AbortController(); cancelled.abort();
  const cleaned = await adapter.cleanupExecution(runtimeContext({ executionId: 'graph-clean', signal: cancelled.signal, isCancelled: () => true }));
  assert.deepEqual(cleaned.map(item => item.handleId), [transient.id]);
  assert.equal((await env.runtimes.get('ws-1', persistent.id)).lifecycle, 'ready');
});
test('provider spawn receives cancellation and abort during allocation rolls back the resource', async () => {
  const env = setup(); await addAccount(env, 'account-a'); const adapter = new RuntimeNodeAdapter(env.runtimes);
  const controller = new AbortController();
  let sawSignal = false; let terminated = 0;
  env.provider.spawn = async (_request, context) => {
    sawSignal = context.signal === controller.signal;
    controller.abort();
    return { providerRuntimeId: 'cancelled-runtime', lifecycle: 'ready', capabilities: ['exec'],
      resource: { kind: 'mock-machine', details: { region: 'test-1' } } };
  };
  env.provider.terminate = async () => { terminated++; };
  const result = await adapter.execute('runtime/spawn', { providerId: 'mock-cloud', accountId: 'account-a', configuration: { region: 'test-1' }, persistence: 'transient' }, runtimeContext({ signal: controller.signal }));
  assert.equal(sawSignal, true);
  assert.equal((result.error as any).code, 'TIMEOUT');
  assert.equal(terminated, 1);
});

test('provider command cancellation is propagated and returned as a timeout', async () => {
  const env = setup(); await addAccount(env, 'account-a'); const adapter = new RuntimeNodeAdapter(env.runtimes);
  const controller = new AbortController();
  const handle = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a',
    configuration: { region: 'test-1' }, persistence: 'persistent', executionId: 'graph-cancel-exec' });
  env.provider.execute = async (_runtime, _request, context) => {
    assert.equal(context.signal, controller.signal);
    controller.abort();
    return { exitCode: 0, stdout: 'must not be returned', stderr: '' };
  };
  const result = await adapter.execute('runtime/execute', { runtime: handle, command: 'echo test' }, runtimeContext({ signal: controller.signal }));
  assert.equal((result.error as any).code, 'TIMEOUT');
});

test('execution cleanup reports provider termination failures instead of hiding them', async () => {
  const env = setup(); await addAccount(env, 'account-a'); const adapter = new RuntimeNodeAdapter(env.runtimes);
  const handle = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'mock-cloud', accountId: 'account-a',
    configuration: { region: 'test-1' }, persistence: 'transient', executionId: 'graph-clean-failure' });
  env.provider.terminate = async () => { throw new RuntimeProviderError('CONNECTION_FAILED', 'Provider termination failed.'); };
  await assert.rejects(() => adapter.cleanupExecution(runtimeContext({ executionId: 'graph-clean-failure' })), /Failed to clean up 1 transient runtime/);
  assert.equal((await env.runtimes.get('ws-1', handle.id)).lifecycle, 'terminating');
});
