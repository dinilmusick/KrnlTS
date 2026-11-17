import test from 'node:test';
import assert from 'node:assert/strict';
import { CredentialStore } from '../storage/credentialStore.js';
import { MemoryWorkspaceStorage } from '../storage/workspaceStorage.js';
import { RuntimeNodeAdapter, RUNTIME_PROVIDER_NODE_DEFINITIONS, createRuntimeNodeToolOutputHandle } from './RuntimeNodeAdapter.js';
import { RuntimeProviderRegistry } from './RuntimeProviderRegistry.js';
import { RuntimeService } from './RuntimeService.js';
import { RuntimeAccountService } from './RuntimeAccountService.js';
import { deserializeRuntimeHandle, serializeRuntimeHandle } from './security.js';
import type { RuntimeProvider } from './types.js';

const providerIds = ['google-cloud-shell', 'fly-io', 'github-codespaces'] as const;
function setup(providerId = 'fly-io') {
  const storage = new MemoryWorkspaceStorage();
  const registry = new RuntimeProviderRegistry();
  const accounts = new RuntimeAccountService(storage);
  let executed = '';
  const provider: RuntimeProvider = {
    id: providerId, displayName: providerId, description: 'Deterministic runtime test double.',
    capabilities: ['exec', 'filesystem', 'persistent'],
    validateConfiguration: config => typeof config.region === 'string' ? [] : ['region is required'],
    describeConfiguration: config => ({ kind: 'test-machine', details: { region: config.region } }),
    async spawn(request) {
      return { providerRuntimeId: 'test-runtime', lifecycle: 'ready', capabilities: ['exec', 'filesystem', 'persistent'],
        resource: { kind: 'test-machine', details: { source: request.source, persistence: request.persistence } } };
    },
    async status() { return 'ready'; },
    async execute(_handle, request) { executed = request.command; return { exitCode: 7, stdout: 'stdout:' + request.command, stderr: 'stderr:test', durationMs: 1 }; },
    async terminate() {},
  };
  registry.register(provider);
  const runtimes = new RuntimeService(registry, accounts, storage);
  return { storage, registry, accounts, runtimes, provider, executed: () => executed };
}
async function account(env: ReturnType<typeof setup>, providerId = 'fly-io') {
  const credentials = new CredentialStore(env.storage);
  await credentials.save('ws-1', { schemaVersion: '1.0.0', name: 'runtime-' + providerId, type: 'API_KEY', data: { type: 'API_KEY', apiKey: 'node-test-secret' } });
  return env.runtimes.saveAccount('ws-1', { id: 'account-1', providerId, displayName: 'Test account', credentialRef: 'runtime-' + providerId });
}

test('provider-specific nodes register as distinct FOD identities with independent metadata', () => {
  assert.deepEqual(RUNTIME_PROVIDER_NODE_DEFINITIONS.map(node => node.type), providerIds.map(id => 'runtime/' + id));
  assert.deepEqual(RUNTIME_PROVIDER_NODE_DEFINITIONS.map(node => node.provider?.id), [...providerIds]);
  assert.equal(new Set(RUNTIME_PROVIDER_NODE_DEFINITIONS.map(node => node.displayName)).size, 3);
  for (const node of RUNTIME_PROVIDER_NODE_DEFINITIONS) {
    assert.equal(node.operation, 'runProviderRuntime');
    assert.equal(node.inputs.command.required, true);
    assert.equal(node.outputs.stdout.type, 'string');
    assert.equal(node.outputs.stderr.type, 'string');
    assert.equal(node.outputs.exitStatus.type, 'number');
    assert.equal(node.outputs.runtime.type, 'object');
    assert.equal(node.outputs.capabilities.type, 'any');
    assert.equal(node.toolOutput.kind, 'tool-output');
    assert.equal(node.toolOutput.capabilityKind, 'runtime');
    assert.ok(node.toolOutput.capabilityId);
    assert.equal(node.toolOutput.inputSchema.type, 'object');
    assert.equal(node.toolOutput.outputSchema.type, 'object');
    assert.equal(node.outputs['tool-output'], undefined);
  }
});

test('runtime node instances receive stable canonical capability handles', () => {
  const first = createRuntimeNodeToolOutputHandle('node-1', 'runtime/fly-io');
  const repeated = createRuntimeNodeToolOutputHandle('node-1', 'runtime/fly-io');
  const second = createRuntimeNodeToolOutputHandle('node-2', 'runtime/fly-io');
  assert.equal(first.id, repeated.id);
  assert.equal(first.capabilityId, repeated.capabilityId);
  assert.notEqual(first.capabilityId, second.capabilityId);
  assert.equal(first.capabilityKind, 'runtime');
  assert.deepEqual(first.inputSchema.required, ['command']);
});

test('catalog reports nodes as registered but marks missing provider adapters unavailable', () => {
  const env = setup();
  const definitions = new RuntimeNodeAdapter(env.runtimes).definitions();
  assert.equal(definitions.find(node => node.type === 'runtime/fly-io')?.available, true);
  assert.equal(definitions.find(node => node.type === 'runtime/google-cloud-shell')?.available, false);
  assert.equal(definitions.find(node => node.type === 'runtime/github-codespaces')?.available, false);
});

test('provider node validates command, configuration, environment, and runtime identity', async () => {
  const env = setup();
  const adapter = new RuntimeNodeAdapter(env.runtimes);
  const context = { workspaceId: 'ws-1', executionId: 'graph-1' };
  assert.equal((await adapter.execute('runtime/fly-io', { command: ' ' }, context) as any).error.code, 'INVALID_CONFIGURATION');
  assert.equal((await adapter.execute('runtime/fly-io', { command: 'pwd', configuration: [] }, context) as any).error.code, 'INVALID_CONFIGURATION');
  assert.equal((await adapter.execute('runtime/fly-io', { command: 'pwd', environment: { NODE_ENV: 1 } }, context) as any).error.code, 'INVALID_CONFIGURATION');
  assert.equal((await adapter.execute('runtime/fly-io', { command: 'pwd', source: [] }, context) as any).error.code, 'INVALID_CONFIGURATION');
  assert.equal((await adapter.execute('runtime/fly-io', { command: 'pwd', persistence: 'ephemeral' }, context) as any).error.code, 'INVALID_CONFIGURATION');
  assert.equal((await adapter.execute('runtime/fly-io', { command: 'pwd', workingDirectory: 42 }, context) as any).error.code, 'INVALID_CONFIGURATION');
  assert.equal((await adapter.execute('runtime/fly-io', { command: 'pwd', runtime: { id: 'x', workspaceId: 'ws-1', providerId: 'google-cloud-shell' } }, context) as any).error.code, 'INVALID_HANDLE');
});

test('provider node selects the matching runtime account and delegates execution', async () => {
  const env = setup();
  await account(env);
  const adapter = new RuntimeNodeAdapter(env.runtimes);
  const result = await adapter.execute('runtime/fly-io', {
    accountId: 'account-1', configuration: { region: 'test-region' }, command: 'npm test',
    files: [{ path: 'input.txt', content: 'hello' }], environment: { CI: 'true' }, persistence: 'persistent',
  }, { workspaceId: 'ws-1', executionId: 'graph-1' }) as any;
  assert.equal(env.executed(), 'npm test');
  assert.equal(result.stdout, 'stdout:npm test');
  assert.equal(result.stderr, 'stderr:test');
  assert.equal(result.exitStatus, 7);
  assert.equal(result.runtime.providerId, 'fly-io');
  assert.equal(result.lifecycle, 'ready');
  assert.deepEqual(result.runtime.resource.details.source.files, [{ path: 'input.txt', content: 'hello' }]);
  assert.deepEqual(deserializeRuntimeHandle(serializeRuntimeHandle(result.runtime)), result.runtime);
});

test('provider node reuses a matching runtime handle without requiring account selection', async () => {
  const env = setup();
  await account(env);
  const spawned = await env.runtimes.spawn({ workspaceId: 'ws-1', providerId: 'fly-io', accountId: 'account-1', configuration: { region: 'test-region' }, persistence: 'persistent' });
  const result = await new RuntimeNodeAdapter(env.runtimes).execute('runtime/fly-io', { runtime: spawned, command: 'echo reused' }, { workspaceId: 'ws-1', executionId: 'graph-1' }) as any;
  assert.equal(result.runtime.id, spawned.id);
  assert.equal(env.executed(), 'echo reused');
});

test('unregistered providers fail explicitly and provider execution errors remain structured', async () => {
  const env = setup();
  const adapter = new RuntimeNodeAdapter(env.runtimes);
  const unsupported = await adapter.execute('runtime/google-cloud-shell', { accountId: 'missing', command: 'pwd' }, { workspaceId: 'ws-1', executionId: 'graph-1' }) as any;
  assert.equal(unsupported.error.code, 'PROVIDER_UNAVAILABLE');
  await account(env);
  env.provider.execute = async () => { throw new Error('provider test failure'); };
  const failed = await adapter.execute('runtime/fly-io', { accountId: 'account-1', configuration: { region: 'test-region' }, command: 'npm test' }, { workspaceId: 'ws-1', executionId: 'graph-1' }) as any;
  assert.equal(failed.error.code, 'COMMAND_FAILED');
  assert.match(failed.error.message, /provider test failure/);
});

test('runtime capability invocation propagates provider unavailability as a deterministic failure', async () => {
  const env = setup();
  const adapter = new RuntimeNodeAdapter(env.runtimes);
  await assert.rejects(
    () => adapter.executeCapability('runtime/google-cloud-shell', { accountId: 'missing', command: 'pwd' }, { workspaceId: 'ws-1', executionId: 'graph-1' }),
    (error: any) => error.code === 'PROVIDER_UNAVAILABLE'
  );
});

test('runtime account provider identity is enforced before allocation', async () => {
  const env = setup();
  const google: RuntimeProvider = {
    ...env.provider, id: 'google-cloud-shell', displayName: 'Google Cloud Shell',
  };
  env.registry.register(google);
  const credentials = new CredentialStore(env.storage);
  await credentials.save('ws-1', { schemaVersion: '1.0.0', name: 'runtime-google', type: 'API_KEY', data: { type: 'API_KEY', apiKey: 'node-test-secret' } });
  await env.runtimes.saveAccount('ws-1', { id: 'google-account', providerId: 'google-cloud-shell', displayName: 'Google account', credentialRef: 'runtime-google' });
  const result = await new RuntimeNodeAdapter(env.runtimes).execute('runtime/fly-io', {
    accountId: 'google-account', configuration: { region: 'test-region' }, command: 'pwd',
  }, { workspaceId: 'ws-1', executionId: 'graph-1' }) as any;
  assert.equal(result.error.code, 'INVALID_ACCOUNT');
});
