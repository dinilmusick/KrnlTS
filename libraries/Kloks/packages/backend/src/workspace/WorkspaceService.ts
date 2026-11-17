/**
 * @file WorkspaceService.ts
 * @description Canonical WorkspaceService interface contract for Kloks backend.
 * Governs remote-first (DEPM) and local working-workspace (QWNSR) architectures.
 * Conforms to Skipo Governance (< 200 lines).
 */

import { WorkspaceSyncSummary } from './types.js';

export interface WorkspaceFileEntry {
  path: string;
  name: string;
  sizeBytes?: number;
  updatedAt?: string | number;
  isFolder?: boolean;
}

export interface WorkspaceLookupResult {
  user?: any;
  workspace: any;
  connection?: any;
}

export interface WorkspaceListResult {
  success: boolean;
  workspaces: any[];
  activeWorkspaceId?: string | null;
  storage_connections?: any[];
}

export interface WorkspaceMutationResult {
  success: boolean;
  workspace?: any;
  workspaces?: any[];
}

export interface WorkspaceService {
  readonly type: 'working';

  findWorkspace(workspaceId: string, env?: Record<string, unknown>): Promise<WorkspaceLookupResult>;

  listWorkspaces(userId?: string, env?: Record<string, unknown>): Promise<WorkspaceListResult>;

  createWorkspace(userId: string, data: any, env?: Record<string, unknown>): Promise<WorkspaceMutationResult>;

  updateWorkspace(userId: string, params: any, env?: Record<string, unknown>): Promise<WorkspaceMutationResult>;

  deleteWorkspace(userId: string, workspaceId: string, env?: Record<string, unknown>): Promise<{ success: boolean; workspaces?: any[] }>;

  readFile(workspaceId: string, filePath: string, env?: Record<string, unknown>): Promise<Uint8Array | string>;

  writeFile(
    workspaceId: string,
    filePath: string,
    content: Uint8Array | string,
    env?: Record<string, unknown>
  ): Promise<{ success: boolean; path: string; sizeBytes?: number }>;

  deleteFile(workspaceId: string, filePath: string, env?: Record<string, unknown>): Promise<{ success: boolean }>;

  listFiles(workspaceId: string, subfolder?: string, env?: Record<string, unknown>): Promise<WorkspaceFileEntry[]>;

  sync?(workspaceId: string, options?: any, env?: Record<string, unknown>): Promise<WorkspaceSyncSummary>;
}
