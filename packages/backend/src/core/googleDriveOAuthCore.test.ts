import { describe, expect, it } from 'vitest';
import {
  completeGoogleDriveAuthorizationCallback,
  createGoogleDriveAuthorizationRequest,
} from './googleDriveOAuthCore.js';

describe('canonical Google Drive OAuth callback boundary', () => {
  it('verifies signed state and nonce before exchanging a callback code', async () => {
    const stateSecret = 'dedicated-google-oauth-state-signing-secret-32';
    let profileWrites = 0;
    const query = async (sql: string) => {
      if (sql.includes('SELECT id, credentials')) {
        return {
          rows: [{
            id: 'system',
            credentials: {
              googleDriveOAuth: {
                clientId: 'system-client-id',
                clientSecret: 'system-client-secret',
                redirectUri: 'https://app.example.test/api/storage/google/callback',
                stateSecret,
                allowedReturnOrigins: ['https://app.example.test'],
              },
            },
          }],
        };
      }
      if (/^\s*(UPDATE|DELETE)\\b/i.test(sql)) profileWrites += 1;
      return { rows: [] };
    };

    const request = await createGoogleDriveAuthorizationRequest({
      userId: 'verified-user-1',
      returnTo: 'https://app.example.test/workspaces',
      callbackOrigin: 'https://app.example.test',
    }, query as any);

    await expect(completeGoogleDriveAuthorizationCallback({
      state: request.state,
      nonceCookie: 'wrong-nonce',
      callbackOrigin: 'https://app.example.test',
      code: 'authorization-code-must-not-be-exchanged',
    }, query as any)).rejects.toThrow(/nonce validation failed/i);

    expect(profileWrites).toBe(0);
  });

  it('rejects an empty callback authorization code after state validation', async () => {
    const query = async (sql: string) => {
      if (sql.includes('SELECT id, credentials')) {
        return {
          rows: [{
            id: 'system',
            credentials: {
              googleDriveOAuth: {
                clientId: 'system-client-id',
                clientSecret: 'system-client-secret',
                redirectUri: 'https://app.example.test/api/storage/google/callback',
                stateSecret: 'another-dedicated-state-signing-secret-32',
                allowedReturnOrigins: [],
              },
            },
          }],
        };
      }
      return { rows: [] };
    };

    const request = await createGoogleDriveAuthorizationRequest({
      userId: 'verified-user-2',
      returnTo: 'https://app.example.test',
      callbackOrigin: 'https://app.example.test',
    }, query as any);

    await expect(completeGoogleDriveAuthorizationCallback({
      state: request.state,
      nonceCookie: request.nonce,
      callbackOrigin: 'https://app.example.test',
      code: ' ',
    }, query as any)).rejects.toThrow(/authorization code is required/i);
  });
});
