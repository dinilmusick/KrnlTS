/**
 * Canonical storage provider registry. Application UIs consume these
 * capabilities instead of maintaining provider allow-lists of their own.
 */

import type { StorageProviderCapability } from './storageContracts.js';
import { getGoogleDriveOAuthConfiguration, type SystemQuery } from './systemCredentialsCore.js';

const BACKBLAZE_B2: StorageProviderCapability = {
  id: 'backblaze_b2',
  displayName: 'Backblaze B2',
  description: 'User-owned Backblaze account and bucket.',
  enabled: true,
  canSelectExistingConnection: true,
  canCreateConnection: true,
  authorizationMode: 'credentials',
  supportsAccountDiscovery: true,
  supportsBucketDiscovery: true,
  supportsFolderDiscovery: false,
  configurationFields: [
    { id: 'keyId', label: 'Application Key ID', type: 'text', required: true, placeholder: 'Backblaze application key ID' },
    { id: 'applicationKey', label: 'Application Key', type: 'password', required: true, secret: true },
    { id: 'label', label: 'Account name', type: 'text', required: false, placeholder: 'My Backblaze account' },
  ],
};

const GOOGLE_DRIVE: StorageProviderCapability = {
  id: 'google_drive',
  displayName: 'Google Drive',
  description: 'Connect a Google account and select a Drive folder.',
  enabled: false,
  unavailableReason: 'SYSTEM_CONFIGURATION_MISSING',
  canSelectExistingConnection: true,
  canCreateConnection: false,
  authorizationMode: 'oauth2',
  supportsAccountDiscovery: true,
  supportsBucketDiscovery: false,
  supportsFolderDiscovery: true,
  configurationFields: [],
};

export async function getStorageProviderCapabilities(
  queryDb: SystemQuery,
): Promise<StorageProviderCapability[]> {
  let googleConfigured = false;
  try {
    await getGoogleDriveOAuthConfiguration(queryDb);
    googleConfigured = true;
  } catch {
    googleConfigured = false;
  }

  return [
    { ...BACKBLAZE_B2 },
    {
      ...GOOGLE_DRIVE,
      enabled: googleConfigured,
      canCreateConnection: googleConfigured,
      ...(googleConfigured ? { unavailableReason: undefined } : {
        unavailableReason: 'SYSTEM_CONFIGURATION_MISSING',
      }),
    },
  ];
}
