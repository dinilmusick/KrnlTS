/**
 * @file RemoteWorkspaceService.ts
 * @description Backward-compatible alias for the canonical active-working WorkspaceService.
 * New Skipo apps must use WorkingWorkspaceService; direct remote file I/O is not an app architecture.
 */
import {
  WorkspaceService,
  WorkspaceFileEntry,
  WorkspaceLookupResult,
  WorkspaceListResult,
  WorkspaceMutationResult,
} from './WorkspaceService.js';
import { WorkspaceSyncSummary } from './types.js';
import { workingWorkspaceService } from './WorkingWorkspaceService.js';

export class RemoteWorkspaceService implements WorkspaceService {
  public readonly type = 'working' as const;

  findWorkspace(id: string, env?: Record<string, unknown>): Promise<WorkspaceLookupResult> {
    return workingWorkspaceService.findWorkspace(id, env);
  }
  listWorkspaces(userId?: string, env?: Record<string, unknown>): Promise<WorkspaceListResult> {
    return workingWorkspaceService.listWorkspaces(userId, env);
  }
  createWorkspace(userId: string, data: any, env?: Record<string, unknown>): Promise<WorkspaceMutationResult> {
    return workingWorkspaceService.createWorkspace(userId, data, env);
  }
  updateWorkspace(userId: string, params: any, env?: Record<string, unknown>): Promise<WorkspaceMutationResult> {
    return workingWorkspaceService.updateWorkspace(userId, params, env);
  }
  deleteWorkspace(userId: string, id: string, env?: Record<string, unknown>): Promise<{ success: boolean; workspaces?: any[] }> {
    return workingWorkspaceService.deleteWorkspace(userId, id, env);
  }
  readFile(id: string, path: string, env?: Record<string, unknown>): Promise<Uint8Array | string> {
    return workingWorkspaceService.readFile(id, path);
  }
  writeFile(id: string, path: string, content: Uint8Array | string, env?: Record<string, unknown>) {
    return workingWorkspaceService.writeFile(id, path, content);
  }
  deleteFile(id: string, path: string, env?: Record<string, unknown>) {
    return workingWorkspaceService.deleteFile(id, path);
  }
  listFiles(id: string, subfolder?: string, env?: Record<string, unknown>): Promise<WorkspaceFileEntry[]> {
    return workingWorkspaceService.listFiles(id, subfolder);
  }
  sync(id: string, options?: any, env?: Record<string, unknown>): Promise<WorkspaceSyncSummary> {
    return workingWorkspaceService.sync(id, options);
  }
}

export const remoteWorkspaceService = workingWorkspaceService;
