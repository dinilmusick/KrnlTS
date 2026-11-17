/**
 * @file googleDriveCredentialStore.ts
 * @description Compatibility adapter that delegates token persistence to Kloks.
 * No tokens are read from or written to SRKL profile JSONB by this module.
 */

import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import type { UserStorageConnection } from '@/libraries/types/auth';

export interface PersistedGoogleDriveTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}

/** Persist refreshed Drive credentials in the canonical encrypted user connection. */
export async function persistGoogleDriveCredentials(
  userId: string,
  connectionId: string,
  tokens: PersistedGoogleDriveTokenSet,
): Promise<UserStorageConnection> {
  if (!userId || !connectionId || !tokens.accessToken) {
    throw new Error('Google Drive credential persistence inputs are incomplete.');
  }

  const connection = await StorageServiceFacade.execute('persistGoogleDriveTokens', {
    userId,
    connectionId,
    tokens,
    env: process.env as Record<string, unknown>,
  }) as UserStorageConnection;

  if (!connection?.id || connection.provider !== 'google_drive') {
    throw new Error('Kloks did not return the updated Google Drive storage connection.');
  }
  return connection;
}
