import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { WorkingWorkspaceService } from '../packages/backend/src/workspace/WorkingWorkspaceService.js';
import { StorageAdapterFactory } from '../packages/backend/src/storage/StorageAdapterFactory.js';
import { WorkspaceAutosaveController } from '../packages/client/src/WorkspaceAutosaveController.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Workspace Storage Ecosystem in Kloks', () => {
  let tmpBaseDir: string;
  let service: WorkingWorkspaceService;

  beforeEach(() => {
    tmpBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kloks-test-ws-'));
    service = new WorkingWorkspaceService((wsId?: string) => {
      const safeId = (wsId || 'default').replace(/[^a-zA-Z0-9._-]/g, '_');
      const dir = path.join(tmpBaseDir, safeId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      return dir;
    });
  });

  afterEach(() => {
    fs.rmSync(tmpBaseDir, { recursive: true, force: true });
  });

  it('isolates workspace-scoped writes, reads, listings and deletes', async () => {
    await service.writeFile('workspace_alpha', 'config.json', JSON.stringify({ name: 'Alpha' }));
    await service.writeFile('workspace_beta', 'config.json', JSON.stringify({ name: 'Beta' }));
    await service.writeFile('workspace_alpha', 'only-in-a.txt', 'secret A');

    expect(JSON.parse((await service.readFile('workspace_alpha', 'config.json')).toString())).toEqual({ name: 'Alpha' });
    expect(JSON.parse((await service.readFile('workspace_beta', 'config.json')).toString())).toEqual({ name: 'Beta' });
    expect((await service.listFiles('workspace_beta')).some((file) => file.name === 'only-in-a.txt')).toBe(false);
    expect((await service.deleteFile('workspace_alpha', 'config.json')).success).toBe(true);
    expect((await service.listFiles('workspace_alpha')).some((file) => file.name === 'config.json')).toBe(false);
    expect(JSON.parse((await service.readFile('workspace_beta', 'config.json')).toString())).toEqual({ name: 'Beta' });
  });

  it('preserves LocalFS, Backblaze B2, S3 and Google Drive factory routing', () => {
    expect(StorageAdapterFactory.create({ provider: 'local_fs' }).constructor.name).toBe('LocalFSAdapter');
    expect(StorageAdapterFactory.create({
      provider: 'backblaze_b2',
      b2KeyId: 'test-key',
      b2ApplicationKey: 'test-app-key',
      b2BucketName: 'test-bucket',
    }).constructor.name).toBe('BackblazeB2Adapter');
    expect(StorageAdapterFactory.create({ provider: 's3' }).constructor.name).toBe('BucketStorageService');
    expect(StorageAdapterFactory.create({ provider: 's3_compatible' }).constructor.name).toBe('BucketStorageService');
    expect(StorageAdapterFactory.create({ provider: 'google_drive' }).constructor.name).toBe('GoogleDriveStorageService');
    expect(() => StorageAdapterFactory.create({ provider: 'aws_s3' as any })).toThrow(/Unsupported storage provider/i);
    expect(() => StorageAdapterFactory.create({ provider: 'random_provider' as any })).toThrow(/Unsupported storage provider/i);
  });

  it('refreshes Google Drive through injected Fetch and persists rotated credentials', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      access_token: 'new-google-access-token',
      expires_in: 3600,
    }));
    const persistCredentials = vi.fn();
    const adapter = StorageAdapterFactory.create({
      provider: 'google_drive',
      googleClientId: 'client-id',
      googleRedirectUri: 'https://app.example.test/callback',
      googleAccessToken: 'expired-access-token',
      googleRefreshToken: 'existing-refresh-token',
      googleAccessTokenExpiresAt: 1,
    }, {
      googleDrive: { fetcher, persistCredentials },
    });

    await expect((adapter as any).refreshTokens()).resolves.toMatchObject({
      accessToken: 'new-google-access-token',
      refreshToken: 'existing-refresh-token',
    });
    expect(persistCredentials).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'new-google-access-token',
      refreshToken: 'existing-refresh-token',
    }));
  });

  it('executes the autosave callback and respects disabled state', async () => {
    let saveCount = 0;
    const controller = new WorkspaceAutosaveController({
      enabled: true,
      intervalMs: 5000,
      save: async () => { saveCount += 1; },
    });

    await controller.saveNow();
    expect(saveCount).toBe(1);
    controller.setEnabled(false);
    await controller.saveNow();
    expect(saveCount).toBe(1);
    controller.stop();
  });
});
