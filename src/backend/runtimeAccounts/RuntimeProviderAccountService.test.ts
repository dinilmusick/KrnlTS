import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryWorkspaceStorage } from '../storage/workspaceStorage.js';
import { CredentialStore } from '../storage/credentialStore.js';
import { RuntimeProviderAccountService } from './RuntimeProviderAccountService.js';
import { RUNTIME_PROVIDER_METADATA, getRuntimeProvider, validateRuntimeProviderFields } from './runtimeProviderMetadata.js';

const token = 'ghp_test_secret_value_123456';
const input = { providerId: 'github-codespaces', displayName: 'Dev Codespace', fields: { personalAccessToken: token, repository: 'acme/app' } };

test('publishes distinct metadata for all initial runtime providers', () => {
  assert.deepEqual(RUNTIME_PROVIDER_METADATA.map(provider => provider.id), ['google-cloud-shell', 'fly-io', 'github-codespaces']);
  assert.ok(RUNTIME_PROVIDER_METADATA.every(provider => provider.execution.available === false));
  assert.equal(getRuntimeProvider('github-codespaces')?.authenticationType, 'personal-access-token');
  assert.equal(getRuntimeProvider('missing'), undefined);
});

test('validates provider-specific required fields and rejects unsupported fields/providers', () => {
  assert.deepEqual(validateRuntimeProviderFields('github-codespaces', {}), ['GitHub personal access token is required.']);
  assert.deepEqual(validateRuntimeProviderFields('fly-io', {}), ['Fly.io access token is required.']);
  assert.deepEqual(validateRuntimeProviderFields('google-cloud-shell', {}), ['OAuth refresh token is required.']);
  assert.ok(validateRuntimeProviderFields('fly-io', { accessToken: 'x', unknown: 'y' }).some(error => error.includes('Unsupported credential field')));
  assert.ok(validateRuntimeProviderFields('github-codespaces', { personalAccessToken: 123 }).some(error => error.includes('must be a string')));
  assert.ok(validateRuntimeProviderFields('fly-io', { accessToken: 'x'.repeat(8193) }).some(error => error.includes('8192 characters')));
  assert.deepEqual(validateRuntimeProviderFields('not-a-provider', { token: 'x' }), ['Unsupported runtime provider.']);
  assert.deepEqual(validateRuntimeProviderFields('google-cloud-shell', { refreshToken: 'refresh' }), []);
});

test('creates workspace-scoped accounts and never exposes credential references or secrets', async () => {
  const storage = new MemoryWorkspaceStorage();
  const service = new RuntimeProviderAccountService(storage);
  const created = await service.create('workspace-a', input);
  assert.equal(created.providerId, input.providerId);
  assert.equal('credentialRef' in created, false);
  assert.equal(JSON.stringify(created).includes(token), false);
  assert.equal((await service.list('workspace-b')).length, 0);
  await assert.rejects(() => service.delete('workspace-b', created.id), /not found/);
  await assert.rejects(() => service.update('workspace-b', created.id, { providerId: input.providerId, displayName: 'Intruder' }), /not found/);
  assert.equal((await service.list('workspace-a')).length, 1);
  assert.equal('credentialRef' in (await service.list('workspace-a'))[0], false);
  assert.equal(JSON.stringify(await service.list('workspace-a')).includes(token), false);
  const stored = await new CredentialStore(storage).get('workspace-a', (await new CredentialStore(storage).list('workspace-a', true))[0].name);
  assert.equal(stored.data.type, 'CUSTOM');
  if (stored.data.type === 'CUSTOM') assert.equal(stored.data.fields.personalAccessToken, token);
});

test('updates account metadata and credentials, then deletes account and credential', async () => {
  const storage = new MemoryWorkspaceStorage();
  const service = new RuntimeProviderAccountService(storage);
  const created = await service.create('workspace-a', input);
  const updated = await service.update('workspace-a', created.id, {
    ...input, displayName: 'Updated Codespace', fields: { personalAccessToken: 'replacement-secret' },
  });
  assert.equal(updated.displayName, 'Updated Codespace');
  assert.equal('credentialRef' in updated, false);
  const optionalUpdated = await service.update('workspace-a', created.id, {
    providerId: input.providerId, displayName: 'Optional field update',
    fields: { personalAccessToken: '', repository: 'acme/next-app' },
  });
  assert.equal(optionalUpdated.displayName, 'Optional field update');
  const renamed = await service.update('workspace-a', created.id, { providerId: input.providerId, displayName: 'Renamed only' });
  assert.equal(renamed.displayName, 'Renamed only');
  const saved = await new CredentialStore(storage).list('workspace-a', true);
  const savedFields = saved[0]?.data.type === 'CUSTOM' ? saved[0].data.fields : {};
  assert.equal(savedFields.personalAccessToken, 'replacement-secret');
  assert.equal(savedFields.repository, 'acme/next-app');
  assert.equal((await service.list('workspace-a')).length, 1);
  assert.equal(await service.delete('workspace-a', created.id), true);
  assert.equal((await service.list('workspace-a')).length, 0);
  assert.equal((await new CredentialStore(storage).list('workspace-a')).length, 0);
});

test('rejects invalid accounts without persisting credentials', async () => {
  const storage = new MemoryWorkspaceStorage();
  const service = new RuntimeProviderAccountService(storage);
  await assert.rejects(() => service.create('workspace-a', { ...input, providerId: 'unsupported' }), /Unsupported runtime provider/);
  await assert.rejects(() => service.create('workspace-a', { ...input, fields: { personalAccessToken: '' } }), /required/);
  assert.equal((await new CredentialStore(storage).list('workspace-a')).length, 0);
  const created = await service.create('workspace-a', input);
  await assert.rejects(() => service.update('workspace-a', created.id, { providerId: input.providerId, displayName: 'Invalid fields', fields: { personalAccessToken: '', unknownField: '' } }), /Unsupported credential field/);
  await assert.rejects(() => service.update('workspace-a', created.id, { providerId: 'fly-io', displayName: 'Changed provider' }), /New credentials are required/);
  assert.equal((await new CredentialStore(storage).list('workspace-a')).length, 1);
});
