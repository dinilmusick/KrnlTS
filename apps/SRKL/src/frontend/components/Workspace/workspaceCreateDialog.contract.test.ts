import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeLegacyStorageConnections, upsertLegacyLocalStorageConnection } from '../../../server/storage/legacyLocalStorageProfile';

test('SRKL renders the installed canonical Floks workspace menu with Kloks storage services', () => {
  const menu = readFileSync('src/frontend/components/AppShell/AppLayout.tsx', 'utf8');
  assert.match(menu, /WorkspaceTilesMenu/);
  assert.match(menu, /createKloksWorkspaceStorageService/);
  assert.match(menu, /storageService=\{workspaceStorageService\}/);
  assert.match(menu, /storagePolicy:\s*\{\s*providers:\s*\['google_drive',\s*'backblaze_b2'\]/);
  assert.match(menu, /hiddenStorageProviders:\s*\['local_fs'\]/);
  assert.match(menu, /hiddenFields:\s*\['localFolderName',\s*'canonicalFolderPreview'\]/);
  assert.doesNotMatch(menu, /storageOptions=\{/);
  assert.doesNotMatch(menu, /StorageConnectDrawer/);

  const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(manifest.dependencies['@ultrst-armada/floks'], '2.0.6');
  assert.equal(manifest.dependencies['@ultrst-armada/kloks'], '2.0.5');

  const workspaceRoute = readFileSync('src/server/routes/workspaces.ts', 'utf8');
  assert.match(workspaceRoute, /Google Drive or Backblaze B2 persistent storage/);
  assert.match(workspaceRoute, /StorageServiceFacade\.execute\('listBackblazeConnectionBuckets'/);
  assert.match(workspaceRoute, /StorageServiceFacade\.execute\('selectGoogleDriveRootFolder'/);
  assert.match(workspaceRoute, /storage\/backblaze\/accounts/);
  assert.match(workspaceRoute, /storage\/backblaze\/buckets/);

  const storageController = readFileSync('src/server/storage/workspaceStorageController.ts', 'utf8');
  assert.match(storageController, /getConnectionsWithSecrets/);
  assert.match(storageController, /createBackblazeConnection/);
  assert.match(storageController, /setPrimaryConnection/);

  const googleRoutes = readFileSync('src/server/routes/googleDrive.ts', 'utf8');
  assert.match(googleRoutes, /createGoogleDriveAuthorizationRequest/);
  assert.match(googleRoutes, /verifyGoogleDriveAuthorizationState/);
  assert.match(googleRoutes, /completeGoogleDriveAuthorization/);
  assert.match(googleRoutes, /selectGoogleDriveRootFolder/);
  assert.doesNotMatch(googleRoutes, /getSystemCredentials|persistGoogleDriveCredentials|GoogleDriveWorkspaceService/);

  const googleStorage = readFileSync('src/server/storage/googleDriveStorageService.ts', 'utf8');
  assert.match(googleStorage, /StorageServiceFacade\.execute/);
  assert.doesNotMatch(googleStorage, /getSystemCredentials|googleAccessToken\s*=|googleRefreshToken\s*=/);
});

test('legacy local-folder updates preserve encrypted cloud records and workspace associations', () => {
  const encryptedCloudConnection = {
    id: 'b2-connection',
    provider: 'backblaze_b2',
    label: 'Vault B2',
    secretCiphertext: {
      version: 1,
      algorithm: 'AES-GCM-256',
      iv: 'opaque-iv',
      ciphertext: 'opaque-ciphertext',
    },
  };
  const profiles = {
    srkl: {
      workspaces: [{
        id: 'vault-1',
        storageProvider: 'backblaze_b2',
        storageConnectionId: 'b2-connection',
      }],
      activeWorkspaceId: 'vault-1',
      storage_connections: [encryptedCloudConnection],
    },
    aiko: {
      workspaces: [{ id: 'aiko-workspace', storageConnectionId: 'aiko-drive' }],
      unrelatedSetting: { preserved: true },
    },
  };

  const result = upsertLegacyLocalStorageConnection(
    profiles,
    {
      id: 'local-1',
      provider: 'local_fs',
      label: 'Local Archive',
      localFolderName: 'Archive',
      // Deliberately ignore unknown browser-supplied secret-like fields.
      b2ApplicationKey: 'must-not-be-persisted',
      googleRefreshToken: 'must-not-be-persisted',
    },
    false,
    '2026-11-16T12:00:00.000Z',
  );

  assert.deepEqual(result.profiles.srkl.storage_connections[0], encryptedCloudConnection);
  assert.deepEqual(result.profiles.srkl.workspaces, profiles.srkl.workspaces);
  assert.equal(result.profiles.srkl.activeWorkspaceId, 'vault-1');
  assert.deepEqual(result.profiles.aiko, profiles.aiko);
  assert.equal(result.connection.provider, 'local_fs');
  assert.equal(result.connection.id, 'local-1');
  assert.equal('b2ApplicationKey' in result.connection, false);
  assert.equal('googleRefreshToken' in result.connection, false);
  assert.doesNotMatch(JSON.stringify(result), /must-not-be-persisted/);
});

test('workspace routes preserve legacy associations and sanitize delegated storage responses', () => {
  const routes = readFileSync('src/server/routes/workspaces.ts', 'utf8');
  assert.match(routes, /workspaces: existingWorkspaces/);
  assert.doesNotMatch(routes, /workspaces = \[canonical\]/);
  assert.match(routes, /activeWorkspace = existingWorkspaces\.find/);
  assert.match(routes, /testStorageConnection\(connection\)/);
  const cloudStorage = readFileSync('src/server/storage/cloudStorageService.ts', 'utf8');
  assert.match(cloudStorage, /StorageServiceFacade\.execute\('listBackblazeConnectionBuckets'/);
  assert.match(cloudStorage, /StorageServiceFacade\.execute\('testGoogleDriveConnection'/);
  assert.match(cloudStorage, /StorageServiceFacade\.execute\('writeWorkspaceStorageFile'/);
  assert.match(routes, /sanitizeStorageConnection\(connection as UserStorageConnection\)/);
  assert.match(routes, /getVerifiedPrincipal\(req\)/);
  assert.doesNotMatch(routes, /req\.body\??\.userId/);
  assert.match(routes, /A verified Luth session is required/);
  assert.match(routes, /StorageServiceFacade\.execute\('listBackblazeConnectionBuckets'/);

  const googleRoutes = readFileSync('src/server/routes/googleDrive.ts', 'utf8');
  assert.match(googleRoutes, /verifyGoogleDriveAuthorizationState/);
  assert.match(googleRoutes, /connectionId,/);
  assert.match(googleRoutes, /googleEmail: connection\.googleEmail/);
  assert.doesNotMatch(googleRoutes, /connections: connections\.filter\(\(connection\) => connection\.provider === 'google_drive'\),/);
});

test('canonical connections supersede matching IDs while legacy storage metadata remains lossless', () => {
  const canonical = [{ id: 'conn-1', provider: 'backblaze_b2', label: 'Canonical B2' }];
  const legacy = [
    { id: 'conn-1', provider: 'backblaze_b2', label: 'Stale duplicate', encryptedSecret: 'legacy-ciphertext-1' },
    { id: 'legacy-local', provider: 'local_fs', label: 'Legacy local folder', localFolderKey: 'old-folder' },
    { id: 'legacy-drive', provider: 'google_drive', label: 'Legacy Drive', encryptedMetadata: 'legacy-ciphertext-2' },
  ];
  const merged = mergeLegacyStorageConnections(canonical, legacy);
  assert.deepEqual(merged.map((connection) => connection.id), ['legacy-local', 'legacy-drive']);
  assert.equal('encryptedMetadata' in merged[1] ? merged[1].encryptedMetadata : undefined, 'legacy-ciphertext-2');
  assert.equal('encryptedSecret' in legacy[0] ? legacy[0].encryptedSecret : undefined, 'legacy-ciphertext-1');
  assert.equal(canonical[0].label, 'Canonical B2');

  const controller = readFileSync('src/server/storage/workspaceStorageController.ts', 'utf8');
  assert.match(controller, /SELECT app_profiles FROM "srkl_application_profiles"/);
  assert.match(controller, /mergeLegacyStorageConnections\(canonicalConnections, legacyConnections\)/);
  assert.match(controller, /__legacyMetadataOnly: true/);
  assert.match(controller, /preferredLegacyLocal/);
  assert.match(controller, /c.enabled !== false/);

  const vault = readFileSync('src/server/storage/workspaceVaultCoordinator.ts', 'utf8');
  assert.match(vault, /__legacyMetadataOnly/);
  assert.match(vault, /connections\.find\(\(connection\) => connection\.provider === ws\.storageProvider/);
  assert.match(vault, /must be reconnected through Kloks/);
});
