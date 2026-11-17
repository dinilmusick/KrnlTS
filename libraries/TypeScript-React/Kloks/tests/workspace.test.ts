/**
 * @file workspace.test.ts
 * @description Architecture tests verifying WorkspaceService contracts:
 * RemoteWorkspaceService and WorkingWorkspaceService conform to canonical WorkspaceService.
 */

import { describe, it, expect } from 'vitest';
import {
  RemoteWorkspaceService,
  remoteWorkspaceService,
} from '../packages/backend/src/workspace/RemoteWorkspaceService.js';
import {
  WorkingWorkspaceService,
  workingWorkspaceService,
} from '../packages/backend/src/workspace/WorkingWorkspaceService.js';
import type { WorkspaceService } from '../packages/backend/src/workspace/WorkspaceService.js';

describe('Workspace Services & Architecture Contracts', () => {
  it('RemoteWorkspaceService conforms to WorkspaceService contract', () => {
    const service: WorkspaceService = remoteWorkspaceService;
    expect(service.type).toBe('working');
    expect(typeof service.findWorkspace).toBe('function');
    expect(typeof service.listWorkspaces).toBe('function');
    expect(typeof service.createWorkspace).toBe('function');
    expect(typeof service.readFile).toBe('function');
    expect(typeof service.writeFile).toBe('function');
    expect(typeof service.deleteFile).toBe('function');
    expect(typeof service.listFiles).toBe('function');
  });

  it('WorkingWorkspaceService conforms to WorkspaceService contract and supports sync', () => {
    const service: WorkspaceService = workingWorkspaceService;
    expect(service.type).toBe('working');
    expect(typeof service.findWorkspace).toBe('function');
    expect(typeof service.listWorkspaces).toBe('function');
    expect(typeof service.createWorkspace).toBe('function');
    expect(typeof service.readFile).toBe('function');
    expect(typeof service.writeFile).toBe('function');
    expect(typeof service.deleteFile).toBe('function');
    expect(typeof service.listFiles).toBe('function');
    expect(typeof service.sync).toBe('function');
  });
});
