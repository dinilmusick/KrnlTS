/**
 * @file krnl-services.node.ts
 * @description Node-only service extensions. Keep filesystem-backed services
 * out of the portable Fetch service entrypoint.
 */

import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import { workspaceGraphService } from './services/workspaceGraphService.js';
import type { UniversalGraphNode, UniversalGraphEdge } from './services/nodeGraphPersistence/types.js';

export const WorkspaceGraphServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.workspaceGraph',
  name: 'WorkspaceGraphService',
  version: '1.0.0',
  operations: {
    listGraphs: {
      id: 'WorkspaceGraphService.listGraphs',
      name: 'listGraphs',
      handler: async (input: { userId: string; workspaceId: string }) =>
        workspaceGraphService.listGraphs(input.userId, input.workspaceId),
    },
    createGraph: {
      id: 'WorkspaceGraphService.createGraph',
      name: 'createGraph',
      handler: async (input: { userId: string; workspaceId: string; name?: string }) =>
        workspaceGraphService.createGraph(input.userId, input.workspaceId, { name: input.name }),
    },
    getGraph: {
      id: 'WorkspaceGraphService.getGraph',
      name: 'getGraph',
      handler: async (input: { userId: string; workspaceId: string; slug: string }) =>
        workspaceGraphService.getGraph(input.userId, input.workspaceId, input.slug),
    },
    saveGraph: {
      id: 'WorkspaceGraphService.saveGraph',
      name: 'saveGraph',
      handler: async (input: {
        userId: string;
        workspaceId: string;
        slug: string;
        nodes?: UniversalGraphNode[];
        edges?: UniversalGraphEdge[];
        name?: string;
      }) => workspaceGraphService.saveGraph(input.userId, input.workspaceId, input.slug, input),
    },
    deleteGraph: {
      id: 'WorkspaceGraphService.deleteGraph',
      name: 'deleteGraph',
      handler: async (input: { userId: string; workspaceId: string; slug: string }) =>
        workspaceGraphService.deleteGraph(input.userId, input.workspaceId, input.slug),
    },
    duplicateGraph: {
      id: 'WorkspaceGraphService.duplicateGraph',
      name: 'duplicateGraph',
      handler: async (input: { userId: string; workspaceId: string; slug: string; newName?: string }) =>
        workspaceGraphService.duplicateGraph(input.userId, input.workspaceId, input.slug, input.newName),
    },
    clearGraph: {
      id: 'WorkspaceGraphService.clearGraph',
      name: 'clearGraph',
      handler: async (input: { userId: string; workspaceId: string; slug: string }) =>
        workspaceGraphService.clearGraph(input.userId, input.workspaceId, input.slug),
    },
  },
});

const workspaceGraphServiceInstance: IService = createService(WorkspaceGraphServiceDefinition);
export const WorkspaceGraphServiceFacade = {
  id: WorkspaceGraphServiceDefinition.id,
  name: WorkspaceGraphServiceDefinition.name,
  version: WorkspaceGraphServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: WorkspaceGraphServiceDefinition,
  createInstance: () => createService(WorkspaceGraphServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await workspaceGraphServiceInstance.start();
    return workspaceGraphServiceInstance.call<TIn, TOut>(op, input);
  },
};

export const krnlWorkspaceGraphServiceDefinition = WorkspaceGraphServiceDefinition;
export const krnlWorkspaceGraphServiceFacade = WorkspaceGraphServiceFacade;
