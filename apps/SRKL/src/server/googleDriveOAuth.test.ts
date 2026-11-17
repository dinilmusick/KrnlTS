import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizationUrl } from './routes/googleDriveOAuth';

test('SRKL delegates Drive OAuth to Kloks with the storage scope and no Google Picker coupling', () => {
  const url = new URL(authorizationUrl(
    'google-client-id',
    'https://srkl.example.test/api/workspaces/storage/google/callback',
    'signed-state',
  ));

  assert.equal(url.searchParams.get('client_id'), 'google-client-id');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://srkl.example.test/api/workspaces/storage/google/callback');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('scope'), 'https://www.googleapis.com/auth/drive');
  assert.equal(url.searchParams.get('state'), 'signed-state');
  assert.equal(url.searchParams.get('include_granted_scopes'), 'true');
  assert.equal(url.searchParams.has('trigger_onepick'), false);
  assert.equal(url.searchParams.has('allow_folder_selection'), false);
});
