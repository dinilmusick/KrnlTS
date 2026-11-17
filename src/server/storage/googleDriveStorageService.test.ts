import assert from 'node:assert/strict';
import { test } from 'node:test';
import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import type { UserStorageConnection } from '../../libraries/types/auth';
import { createGoogleDriveStorageAdapter } from './googleDriveStorageService';

test('SRKL delegates Google Drive operations to Kloks and never configures OAuth locally', async () => {
  const originalExecute = StorageServiceFacade.execute;
  const calls: Array<{ operation: string; input: any }> = [];
  (StorageServiceFacade as any).execute = async (operation: string, input: any) => {
    calls.push({ operation, input });
    if (operation === 'getGoogleDriveAccountIdentity') return { accountId: 'google-subject', email: 'owner@example.test' };
    if (operation === 'testGoogleDriveConnection') return { success: true, latencyMs: 12, email: 'owner@example.test' };
    return { success: true };
  };

  try {
    const connection: UserStorageConnection = {
      id: 'drive-test',
      provider: 'google_drive',
      label: 'Drive test',
      createdAt: new Date().toISOString(),
      googleRootFolderId: 'root-folder',
      googleAccessToken: 'server-only-access-token',
      googleAccessTokenExpiresAt: Date.now() + 10 * 60_000,
      __ownerUserId: 'user-1',
    } as UserStorageConnection;

    const adapter = await createGoogleDriveStorageAdapter(connection, {
      // These legacy values are intentionally ignored; system-owned settings
      // are resolved by Kloks from the canonical credentials record.
      clientId: 'must-not-be-used',
      clientSecret: 'must-not-be-used',
      redirectUri: 'https://wrong.example/callback',
    });

    const identity = await adapter.getAccountIdentity();
    assert.equal(identity.email, 'owner@example.test');
    assert.equal(calls[0]?.operation, 'getGoogleDriveAccountIdentity');
    assert.equal(calls[0]?.input.userId, 'user-1');
    assert.equal(calls[0]?.input.connectionId, 'drive-test');
    assert.equal(JSON.stringify(calls[0]?.input).includes('server-only-access-token'), false);
  } finally {
    (StorageServiceFacade as any).execute = originalExecute;
  }
});

test('SRKL refuses to operate on a Google Drive connection without verified owner context', async () => {
  const connection: UserStorageConnection = {
    id: 'drive-unowned',
    provider: 'google_drive',
    label: 'Unowned Drive connection',
    createdAt: new Date().toISOString(),
  };

  await assert.rejects(
    createGoogleDriveStorageAdapter(connection),
    /verified owner and connection ID/,
  );
});

test('SRKL Google Drive health checks delegate to the Kloks connection service', async () => {
  const originalExecute = StorageServiceFacade.execute;
  let received: any;
  (StorageServiceFacade as any).execute = async (operation: string, input: any) => {
    received = { operation, input };
    return { success: true, latencyMs: 17, email: 'owner@example.test' };
  };
  try {
    const connection = {
      id: 'drive-health',
      provider: 'google_drive',
      label: 'Drive health',
      createdAt: new Date().toISOString(),
      __ownerUserId: 'user-2',
    } as UserStorageConnection;
    const { testGoogleDriveConnection } = await import('./googleDriveStorageService');
    const result = await testGoogleDriveConnection(connection);
    assert.equal(result.success, true);
    assert.equal(received.operation, 'testGoogleDriveConnection');
    assert.equal(received.input.userId, 'user-2');
    assert.equal(received.input.connectionId, 'drive-health');
  } finally {
    (StorageServiceFacade as any).execute = originalExecute;
  }
});
