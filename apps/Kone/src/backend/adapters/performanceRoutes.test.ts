import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execute, readFile, writeFile } = vi.hoisted(() => ({
  execute: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('@ultrst-armada/kloks/backend/krnl-services', () => ({
  WorkspaceServiceFacade: { execute },
}));
vi.mock('@ultrst-armada/kloks/backend/node', () => ({
  workingWorkspaceService: { readFile, writeFile },
}));

import { handlePerformanceRoutes } from './performanceRoutes.js';

const env = { SYSTEM_DATABASE_URL: 'postgres://system' };

describe('performance persistence route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execute.mockResolvedValue({ workspace: { id: 'ws-1' }, user: { id: 'user-1' } });
  });

  it('returns no performance when the workspace file does not exist', async () => {
    readFile.mockRejectedValue(new Error('File not found'));
    const response = await handlePerformanceRoutes(
      new Request('http://localhost/api/performance?workspaceId=ws-1'),
      'user-1',
      env,
    );
    await expect(response?.json()).resolves.toEqual({ success: true, performance: null });
  });

  it('rejects a workspace owned by another user', async () => {
    execute.mockResolvedValue({ workspace: { id: 'ws-1' }, user: { id: 'other-user' } });
    const response = await handlePerformanceRoutes(
      new Request('http://localhost/api/performance?workspaceId=ws-1'),
      'user-1',
      env,
    );
    expect(response?.status).toBe(404);
  });

  it('persists a valid performance definition', async () => {
    const performance = { id: 'performance-1', name: 'Performance One', songs: [] };
    const response = await handlePerformanceRoutes(
      new Request('http://localhost/api/performance?workspaceId=ws-1', {
        method: 'PUT',
        body: JSON.stringify({ performance }),
        headers: { 'Content-Type': 'application/json' },
      }),
      'user-1',
      env,
    );
    expect(response?.status).toBe(200);
    expect(writeFile).toHaveBeenCalledWith(
      'ws-1',
      'kone/performance.json',
      JSON.stringify(performance),
    );
  });
});
