/**
 * @file WorkingWorkspaceService.ts
 * @description Local Working-Workspace implementation for Kloks.
 * Operates on a local working directory for fast low-latency I/O and explicitly
 * synchronizes with authoritative remote storage (Backblaze B2/S3/DB).
 * Canonical choice for QWNSR. Conforms to Skipo Governance (< 200 lines).
 */

import fs from 'fs';
import path from 'path';
import {
  WorkspaceService,
  WorkspaceFileEntry,
  WorkspaceLookupResult,
  WorkspaceListResult,
  WorkspaceMutationResult,
} from './WorkspaceService.js';
import { WorkspaceSyncSummary } from './types.js';
import {
  findUserWorkspace,
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../core/workspaceCore.js';
import {
  syncWorkspace,
  getWorkingWorkspaceDir,
} from '../core/workspaceSyncEngine.js';

export class WorkingWorkspaceService implements WorkspaceService {
  public readonly type = 'working' as const;

  constructor(private workingDirResolver?: (workspaceId?: string) => string) {}

  getWorkingDir(workspaceId?: string): string {
    return this.workingDirResolver ? this.workingDirResolver(workspaceId) : getWorkingWorkspaceDir(workspaceId);
  }

  async findWorkspace(workspaceId: string, env?: Record<string, unknown>): Promise<WorkspaceLookupResult> {
    return await findUserWorkspace(workspaceId, env);
  }

  async listWorkspaces(userId?: string, env?: Record<string, unknown>): Promise<WorkspaceListResult> {
    return await getWorkspaces(userId, env);
  }

  async createWorkspace(userId: string, data: any, env?: Record<string, unknown>): Promise<WorkspaceMutationResult> {
    const res = await createWorkspace(userId, data, env);
    const dir = this.getWorkingDir(res.workspace?.id || data?.id || 'default');
    try {
      await fs.promises.mkdir(dir, { recursive: true });
    } catch {}
    return res;
  }

  async updateWorkspace(userId: string, params: any, env?: Record<string, unknown>): Promise<WorkspaceMutationResult> {
    return await updateWorkspace(userId, params, env);
  }

  async deleteWorkspace(userId: string, workspaceId: string, env?: Record<string, unknown>): Promise<{ success: boolean; workspaces?: any[] }> {
    return await deleteWorkspace(userId, workspaceId, env);
  }

  async readFile(_workspaceId: string, filePath: string): Promise<Uint8Array | string> {
    const cleanRel = filePath.replace(/^\/+/, '');
    const fullPath = path.resolve(this.getWorkingDir(_workspaceId), cleanRel);
    return await fs.promises.readFile(fullPath);
  }

  async writeFile(
    _workspaceId: string,
    filePath: string,
    content: Uint8Array | string
  ): Promise<{ success: boolean; path: string; sizeBytes?: number }> {
    const cleanRel = filePath.replace(/^\/+/, '');
    const fullPath = path.resolve(this.getWorkingDir(_workspaceId), cleanRel);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    const buffer = typeof content === 'string' ? Buffer.from(content) : Buffer.from(content.buffer, content.byteOffset, content.byteLength);
    await fs.promises.writeFile(fullPath, buffer);
    return { success: true, path: filePath, sizeBytes: buffer.byteLength };
  }

  async deleteFile(_workspaceId: string, filePath: string): Promise<{ success: boolean }> {
    const cleanRel = filePath.replace(/^\/+/, '');
    const fullPath = path.resolve(this.getWorkingDir(_workspaceId), cleanRel);
    try {
      await fs.promises.unlink(fullPath);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async listFiles(_workspaceId: string, subfolder = ''): Promise<WorkspaceFileEntry[]> {
    const baseDir = path.resolve(this.getWorkingDir(_workspaceId), subfolder.replace(/^\/+/, ''));
    if (!fs.existsSync(baseDir)) return [];

    const entries = await fs.promises.readdir(baseDir, { withFileTypes: true });
    return entries.map((e) => {
      const full = path.join(baseDir, e.name);
      let sizeBytes = 0;
      let updatedAt = Date.now();
      try {
        const s = fs.statSync(full);
        sizeBytes = s.size;
        updatedAt = s.mtimeMs;
      } catch {}
      return {
        path: path.relative(this.getWorkingDir(_workspaceId), full),
        name: e.name,
        isFolder: e.isDirectory(),
        sizeBytes,
        updatedAt,
      };
    });
  }

  async sync(workspaceId: string, _options?: any, _env?: Record<string, unknown>): Promise<WorkspaceSyncSummary> {
    return await syncWorkspace(workspaceId);
  }
}

export const workingWorkspaceService = new WorkingWorkspaceService();
