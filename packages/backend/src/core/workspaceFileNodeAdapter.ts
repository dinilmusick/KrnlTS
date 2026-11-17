/**
 * @file workspaceFileNodeAdapter.ts
 * @description Node-only local filesystem implementation for workspace file IO.
 * Imported only by the explicit @ultrst-armada/kloks/backend/node entrypoint.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { configureLocalWorkspaceFileAdapter } from './workspaceFileCore.js';

function resolveSafe(relativePath: string): string {
  const root = path.resolve(process.cwd());
  const resolved = path.resolve(root, String(relativePath || ''));
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error('Workspace file path escapes the configured local storage root.');
  }
  return resolved;
}

async function listFiles(directory: string, root: string): Promise<Array<{ fileName: string; sizeBytes: number }>> {
  const output: Array<{ fileName: string; sizeBytes: number }> = [];
  let entries: Array<import('node:fs').Dirent>;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries) {
    // Never traverse symlinks from user-controlled workspace paths.
    if (entry.isSymbolicLink()) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...await listFiles(fullPath, root));
    } else if (entry.isFile()) {
      const stat = await fs.stat(fullPath);
      output.push({
        fileName: path.relative(root, fullPath).replace(/\\/g, '/'),
        sizeBytes: stat.size,
      });
    }
  }
  return output;
}

configureLocalWorkspaceFileAdapter({
  async write(filePath, content) {
    const target = resolveSafe(filePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  },

  async read(filePath) {
    try {
      return new Uint8Array(await fs.readFile(resolveSafe(filePath)));
    } catch (error: any) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  },

  async delete(filePath) {
    try {
      await fs.unlink(resolveSafe(filePath));
      return true;
    } catch (error: any) {
      if (error?.code === 'ENOENT') return false;
      throw error;
    }
  },

  async list(directory) {
    const root = resolveSafe(directory);
    return listFiles(root, root);
  },

  async deleteFolder(directory) {
    await fs.rm(resolveSafe(directory), { recursive: true, force: true });
  },
});
