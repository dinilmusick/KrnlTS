import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeCredentialDraft } from './runtimeProviderForm.js';

test('provider selection creates only the selected provider credential inputs', () => {
  const google = createRuntimeCredentialDraft([{ id: 'refreshToken' }, { id: 'projectId' }]);
  const fly = createRuntimeCredentialDraft([{ id: 'accessToken' }, { id: 'organizationSlug' }]);
  const codespaces = createRuntimeCredentialDraft([{ id: 'personalAccessToken' }, { id: 'repository' }]);
  assert.deepEqual(Object.keys(google), ['refreshToken', 'projectId']);
  assert.deepEqual(Object.keys(fly), ['accessToken', 'organizationSlug']);
  assert.deepEqual(Object.keys(codespaces), ['personalAccessToken', 'repository']);
  assert.ok(Object.values(codespaces).every(value => value === ''));
});
