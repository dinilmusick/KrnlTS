import { afterEach, describe, expect, it, vi } from 'vitest';

const { storageExecute, workspaceExecute } = vi.hoisted(() => ({
  storageExecute: vi.fn(),
  workspaceExecute: vi.fn(),
}));

vi.mock('@ultrst-armada/kloks/backend/krnl-services', () => ({
  StorageServiceFacade: { execute: storageExecute },
  WorkspaceServiceFacade: { execute: workspaceExecute },
  SrklServiceFacade: { execute: vi.fn() },
}));

vi.mock('../auth/luthSession.js', () => ({
  proxyLuthAuthRequest: vi.fn(async () => null),
  authenticateLuthRequest: vi.fn(async (request: Request) => {
    const headers = new Headers(request.headers);
    headers.set('x-user-id', 'verified-luth-user');
    return { request: new Request(request, { headers }) };
  }),
}));

import { fetchHandler } from './httpsAdapter.js';

const env = {
  SYSTEM_DATABASE_URL: 'postgresql://primary.example/db',
  SYSTEM_DATABASE_URL_2: 'postgresql://fallback-two.example/db',
  SYSTEM_DATABASE_URL_3: 'postgresql://fallback-three.example/db',
  APP_URL: 'https://kone.example',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('KONE authenticated canonical storage routes', () => {
  it('uses the verified Luth owner for existing connections and passes normalized environment', async () => {
    storageExecute.mockResolvedValue([{ id: 'connection-1', provider: 'backblaze_b2' }]);
    const response = await fetchHandler(new Request('https://kone.example/api/storage/connections'), env);
    expect(response.status).toBe(200);
    expect(storageExecute).toHaveBeenCalledWith('getConnections', expect.objectContaining({
      userId: 'verified-luth-user',
      env: expect.objectContaining({
        SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL,
        SYSTEM_DATABASE_URL_2: env.SYSTEM_DATABASE_URL_2,
        SYSTEM_DATABASE_URL_3: env.SYSTEM_DATABASE_URL_3,
        APP_URL: env.APP_URL,
        WORKSPACE_APP_ID: 'kone',
      }),
    }));
  });

  it('passes normalized environment to B2 credential testing without persisting credentials', async () => {
    storageExecute.mockResolvedValue({ success: true, buckets: [] });
    const response = await fetchHandler(new Request('https://kone.example/api/storage/connections/backblaze/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId: 'test-key', applicationKey: 'test-secret' }),
    }), env);
    expect(response.status).toBe(200);
    expect(storageExecute).toHaveBeenCalledWith('testBackblazeCredentials', expect.objectContaining({
      keyId: 'test-key',
      applicationKey: 'test-secret',
      env: expect.objectContaining({ SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL, APP_URL: env.APP_URL }),
    }));
  });

  it('returns provider capabilities through the canonical Kloks facade', async () => {
    storageExecute.mockResolvedValue([{ id: 'backblaze_b2', enabled: true }, { id: 'google_drive', enabled: true }]);
    const response = await fetchHandler(new Request('https://kone.example/api/storage/providers'), env);
    expect(response.status).toBe(200);
    expect(storageExecute).toHaveBeenCalledWith('getProviderCapabilities', expect.objectContaining({
      env: expect.objectContaining({ SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL, APP_URL: env.APP_URL }),
    }));
  });

  it('creates B2 connections under the verified owner and passes normalized environment', async () => {
    storageExecute.mockResolvedValue({ id: 'b2-connection', provider: 'backblaze_b2' });
    const response = await fetchHandler(new Request('https://kone.example/api/storage/connections/backblaze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'spoofed-user',
        label: 'Archive',
        keyId: 'b2-key',
        applicationKey: 'b2-secret',
        bucketName: 'archive',
      }),
    }), env);
    expect(response.status).toBe(201);
    expect(storageExecute).toHaveBeenCalledWith('createBackblazeConnection', expect.objectContaining({
      userId: 'verified-luth-user',
      keyId: 'b2-key',
      applicationKey: 'b2-secret',
      bucketName: 'archive',
      env: expect.objectContaining({ SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL, APP_URL: env.APP_URL }),
    }));
  });

  it('discovers B2 buckets using the verified owner and saved connection identifier', async () => {
    storageExecute.mockResolvedValue([{ id: 'bucket-1', name: 'archive' }]);
    const response = await fetchHandler(new Request('https://kone.example/api/storage/connections/backblaze/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: 'b2-connection', userId: 'spoofed-user' }),
    }), env);
    expect(response.status).toBe(200);
    expect(storageExecute).toHaveBeenCalledWith('listBackblazeConnectionBuckets', expect.objectContaining({
      userId: 'verified-luth-user',
      connectionId: 'b2-connection',
      env: expect.objectContaining({ SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL }),
    }));
  });

  it('exercises the canonical workspace query consumer for authenticated database health', async () => {
    workspaceExecute.mockResolvedValue([{ id: 'workspace-1' }]);
    const response = await fetchHandler(new Request('https://kone.example/api/health/database'), env);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok', database: 'connected' });
    expect(workspaceExecute).toHaveBeenCalledWith('listWorkspaces', expect.objectContaining({
      userId: 'verified-luth-user',
      env: expect.objectContaining({
        SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL,
        SYSTEM_DATABASE_URL_2: env.SYSTEM_DATABASE_URL_2,
        SYSTEM_DATABASE_URL_3: env.SYSTEM_DATABASE_URL_3,
        APP_URL: env.APP_URL,
      }),
    }));
  });
});
