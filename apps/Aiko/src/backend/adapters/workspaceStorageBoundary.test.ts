import test from 'node:test';
import assert from 'node:assert/strict';
import {
  configureNodeWorkspaceService,
  KloksWorkspaceStorage,
} from '../storage/workspaceStorage.js';

test('Kloks workspace storage uses Node injection and keeps a portable memory fallback', async () => {
  const files = new Map<string, string>();
  const calls: string[] = [];
  configureNodeWorkspaceService({
    async readFile(workspaceId, filePath) {
      calls.push(`read:${workspaceId}/${filePath}`);
      const key = `${workspaceId}/${filePath}`;
      if (!files.has(key)) throw new Error('not found');
      return files.get(key)!;
    },
    async writeFile(workspaceId, filePath, data) {
      calls.push(`write:${workspaceId}/${filePath}`);
      files.set(`${workspaceId}/${filePath}`, data);
    },
    async deleteFile(workspaceId, filePath) {
      calls.push(`delete:${workspaceId}/${filePath}`);
      files.delete(`${workspaceId}/${filePath}`);
    },
    async listFiles(workspaceId, filePath) {
      calls.push(`list:${workspaceId}/${filePath}`);
      const prefix = `${workspaceId}/${filePath.replace(/\/+$/, '')}`.replace(/\/+$/, '') + '/';
      return [...files.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => ({ name: key.slice(prefix.length).split('/')[0] }))
        .filter((entry, index, all) => all.findIndex((candidate) => candidate.name === entry.name) === index);
    },
    async listWorkspaces() {
      return { success: true, workspaces: [], activeWorkspaceId: null };
    },
    async createWorkspace(_userId, data) {
      return { success: true, workspace: data };
    },
    async deleteWorkspace() {
      return { success: true };
    },
  });

  try {
    const storage = new KloksWorkspaceStorage();
    await storage.write('workspace-a/docs/readme.md', 'hello');
    assert.equal(await storage.read('workspace-a/docs/readme.md'), 'hello');
    assert.equal(await storage.exists('workspace-a/docs/readme.md'), true);
    assert.deepEqual(await storage.list('workspace-a/docs'), ['readme.md']);
    await storage.delete('workspace-a/docs/readme.md');
    assert.equal(await storage.exists('workspace-a/docs/readme.md'), false);
    assert.ok(calls.includes('write:workspace-a/docs/readme.md'));
    assert.ok(calls.includes('read:workspace-a/docs/readme.md'));
  } finally {
    configureNodeWorkspaceService(null);
  }

  const memoryStorage = new KloksWorkspaceStorage();
  await memoryStorage.write('workspace-b/memory.txt', 'edge fallback');
  assert.equal(await memoryStorage.read('workspace-b/memory.txt'), 'edge fallback');
  assert.deepEqual(await memoryStorage.list('workspace-b'), ['memory.txt']);
});
