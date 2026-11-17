// Aiko application backend facade. Reusable infrastructure and AI runtime services come from Kloks; Aiko-specific intelligence remains local.

import { WorkerExecutionBoundary, type IServiceFacade } from '@ultrst-armada/krnl';
import {
  StorageServiceFacade,
  WorkspaceServiceFacade,
  ControlPlaneServiceFacade,
  AIProviderServiceFacade,
  AIInferenceServiceFacade,
  AIModelCatalogServiceFacade,
  AIRoutingServiceFacade,
  AIKeyServiceFacade,
  AIToolServiceFacade,
  workingWorkspaceService,
} from '@ultrst-armada/kloks/backend/node';

import { BackendFacade, backendFacade } from './BackendFacade.js';
import { matchingEngine } from './intelligence/matchingEngine.js';
import { presetsStorage } from './storage/presetsStorage.js';
import { modelHealthService } from './intelligence/modelHealthService.js';
import { profileSolver } from './profileSolver.js';
import { dbStore } from './dbStore.js';
import { WorkspaceRepository } from './storage/workspaceRepository.js';
import { workspaceFS } from './storage/workspaceFileSystem.js';
import { configureNodeWorkspaceService } from './storage/workspaceStorage.js';
import { CredentialStore } from './storage/credentialStore.js';
import { apiRouter } from './apiRoutes.js';
import { authRouter, databaseRouter } from './authRoutes.js';
import { storageRouter } from './storageRoutes.js';
import { ChatExecutionBridge } from './agentic/chat/chatExecutionBridge.js';
import { workflowService } from './workflows/WorkflowService.js';
import { AI_AGENT_NODE_CONTRACT, registerAIAgentNode } from './workflows/aiAgentNode.js';
import * as workflowCapabilities from './workflows/capabilities/index.js';
import { TaskScheduler } from './agentic/scheduler/TaskScheduler.js';
import * as accounts from './accounts/index.js';
import { runtimeAccountService, runtimeProviderRegistry, runtimeService } from './runtime/index.js';
import { RuntimeNodeAdapter } from './runtime/RuntimeNodeAdapter.js';

const runtimeNodeAdapter = new RuntimeNodeAdapter(runtimeService);

// Preserve the canonical Node workspace adapter for consumers that initialize
// AikoBackend directly rather than through server.ts.
configureNodeWorkspaceService(workingWorkspaceService);

backendFacade.registerService(StorageServiceFacade as unknown as IServiceFacade);
backendFacade.registerService(WorkspaceServiceFacade as unknown as IServiceFacade);
backendFacade.registerService(ControlPlaneServiceFacade as unknown as IServiceFacade);
backendFacade.registerService(AIProviderServiceFacade as unknown as IServiceFacade);
backendFacade.registerService(AIInferenceServiceFacade as unknown as IServiceFacade);
backendFacade.registerService(AIModelCatalogServiceFacade as unknown as IServiceFacade);
backendFacade.registerService(AIRoutingServiceFacade as unknown as IServiceFacade);
backendFacade.registerService(AIKeyServiceFacade as unknown as IServiceFacade);
backendFacade.registerService(AIToolServiceFacade as unknown as IServiceFacade);

export const services = {
  modelCatalog: AIModelCatalogServiceFacade,
  keyStore: AIKeyServiceFacade,
  accounts,
  intelligence: { matchingEngine, presetsStorage, modelHealthService, profileSolver },
  db: { dbStore },
  storage: { WorkspaceRepository, workspaceFS, CredentialStore },
  agentic: { ChatExecutionBridge, TaskScheduler },
  workflows: { workflowService },
  runtime: { service: runtimeService, accounts: runtimeAccountService, providers: runtimeProviderRegistry },
  routes: { apiRouter, authRouter, databaseRouter, storageRouter },
  kloks: {
    storage: StorageServiceFacade,
    workspace: WorkspaceServiceFacade,
    controlPlane: ControlPlaneServiceFacade,
    ai: {
      provider: AIProviderServiceFacade,
      inference: AIInferenceServiceFacade,
      models: AIModelCatalogServiceFacade,
      routing: AIRoutingServiceFacade,
      keys: AIKeyServiceFacade,
      tools: AIToolServiceFacade,
    },
  },
};

export const orchestrations = {
  chatBridge: ChatExecutionBridge,
  matchingEngine,
  runtimeNodes: runtimeNodeAdapter,
  aiAgent: { contract: AI_AGENT_NODE_CONTRACT, register: registerAIAgentNode },
  capabilities: workflowCapabilities,
};

export const aikoWorkerBoundary = new WorkerExecutionBoundary('aiko_worker_main');

export const AikoBackend = {
  services,
  orchestrations,
  worker: aikoWorkerBoundary,
  WorkerExecutionBoundary: aikoWorkerBoundary,
  backendFacade,
  executableFacade: backendFacade,
  isWorkerContext: true,
};

export { backendFacade, backendFacade as executableFacade, WorkerExecutionBoundary };
export default AikoBackend;
