/**
 * @file krnl-ai-services.ts
 * @description First-class KrnlTS ServiceDefinitions and ServiceFacades for AI packages
 */

import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import { aiProviderService } from './ai-provider/AIProviderService.js';
import { inferenceExecutor } from './ai-inference/inferenceExecutor.js';
import { modelCatalog } from './ai-models/modelCatalog.js';
import { failoverExecutionEngine } from './ai-routing/failoverEngine.js';
import { keyStore } from './ai-keys/keyStore.js';
import { toolManagerService } from './ai-tools/ToolManagerService.js';

// 1. AIProviderService
export const AIProviderServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.aiProvider',
  name: 'AIProviderService',
  version: '1.0.0',
  operations: {
    listProviders: {
      id: 'AIProviderService.listProviders',
      name: 'listProviders',
      handler: async () => aiProviderService.listProviders(),
    },
    getProvider: {
      id: 'AIProviderService.getProvider',
      name: 'getProvider',
      handler: async (input: { id: string }) => aiProviderService.getProvider(input.id),
    },
    checkHealth: {
      id: 'AIProviderService.checkHealth',
      name: 'checkHealth',
      handler: async (input: { id: string; apiKey?: string }) => aiProviderService.checkHealth(input.id, input.apiKey),
    },
  },
});

const aiProviderInstance: IService = createService(AIProviderServiceDefinition);
export const AIProviderServiceFacade = {
  id: AIProviderServiceDefinition.id,
  name: AIProviderServiceDefinition.name,
  version: AIProviderServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: AIProviderServiceDefinition,
  createInstance: () => createService(AIProviderServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await aiProviderInstance.start();
    return aiProviderInstance.call<TIn, TOut>(op, input);
  },
};

// 2. AIInferenceService
export const AIInferenceServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.aiInference',
  name: 'AIInferenceService',
  version: '1.0.0',
  operations: {
    execute: {
      id: 'AIInferenceService.execute',
      name: 'execute',
      handler: async (input: {
        providerId: string;
        modelId: string;
        apiKey: string;
        prompt: string;
        options?: any;
      }) => inferenceExecutor.execute(input.providerId, input.modelId, input.apiKey, input.prompt, input.options),
    },
  },
});

const aiInferenceInstance: IService = createService(AIInferenceServiceDefinition);
export const AIInferenceServiceFacade = {
  id: AIInferenceServiceDefinition.id,
  name: AIInferenceServiceDefinition.name,
  version: AIInferenceServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: AIInferenceServiceDefinition,
  createInstance: () => createService(AIInferenceServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await aiInferenceInstance.start();
    return aiInferenceInstance.call<TIn, TOut>(op, input);
  },
};

// 3. AIModelCatalogService
export const AIModelCatalogServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.aiModels',
  name: 'AIModelCatalogService',
  version: '1.0.0',
  operations: {
    getAllModels: {
      id: 'AIModelCatalogService.getAllModels',
      name: 'getAllModels',
      handler: async () => modelCatalog.getAllModels(),
    },
    getModel: {
      id: 'AIModelCatalogService.getModel',
      name: 'getModel',
      handler: async (input: { id: string }) => modelCatalog.getModel(input.id),
    },
  },
});

const aiModelCatalogInstance: IService = createService(AIModelCatalogServiceDefinition);
export const AIModelCatalogServiceFacade = {
  id: AIModelCatalogServiceDefinition.id,
  name: AIModelCatalogServiceDefinition.name,
  version: AIModelCatalogServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  getCatalog: (providerId?: string) => modelCatalog.getCatalog(providerId as any),
  getProviderStatuses: () => modelCatalog.getProviderStatuses(),
  refreshCatalogFromEndpoints: () => modelCatalog.refreshCatalogFromEndpoints(),
  definition: AIModelCatalogServiceDefinition,
  createInstance: () => createService(AIModelCatalogServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await aiModelCatalogInstance.start();
    return aiModelCatalogInstance.call<TIn, TOut>(op, input);
  },
};

// 4. AIRoutingService
export const AIRoutingServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.aiRouting',
  name: 'AIRoutingService',
  version: '1.0.0',
  operations: {
    executeWithFailover: {
      id: 'AIRoutingService.executeWithFailover',
      name: 'executeWithFailover',
      handler: async (input: { candidates: any[]; executeFn: (c: any) => Promise<any>; policy?: any }) =>
        failoverExecutionEngine.executeWithFailover(input.candidates, input.executeFn, input.policy),
    },
  },
});

const aiRoutingInstance: IService = createService(AIRoutingServiceDefinition);
export const AIRoutingServiceFacade = {
  id: AIRoutingServiceDefinition.id,
  name: AIRoutingServiceDefinition.name,
  version: AIRoutingServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: AIRoutingServiceDefinition,
  createInstance: () => createService(AIRoutingServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await aiRoutingInstance.start();
    return aiRoutingInstance.call<TIn, TOut>(op, input);
  },
};

// 5. AIKeyService
export const AIKeyServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.aiKeys',
  name: 'AIKeyService',
  version: '1.0.0',
  operations: {
    getKeys: {
      id: 'AIKeyService.getKeys',
      name: 'getKeys',
      handler: async (input?: { providerId?: string }) => keyStore.getKeys(input?.providerId),
    },
    getActiveKey: {
      id: 'AIKeyService.getActiveKey',
      name: 'getActiveKey',
      handler: async (input: { providerId: string }) => keyStore.getActiveKey(input.providerId),
    },
    verifyKey: {
      id: 'AIKeyService.verifyKey',
      name: 'verifyKey',
      handler: async (input: { id: string }) => keyStore.verifyKey(input.id),
    },
  },
});

const aiKeyInstance: IService = createService(AIKeyServiceDefinition);
export const AIKeyServiceFacade = {
  id: AIKeyServiceDefinition.id,
  name: AIKeyServiceDefinition.name,
  version: AIKeyServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  getKeys: (providerId?: string, modelId?: string) => keyStore.getKeys(providerId as any, modelId),
  getStrategy: () => keyStore.getStrategy(),
  addKey: (input: any) => keyStore.addKey(input),
  getActiveKey: (providerId: string) => keyStore.getActiveKey(providerId),
  rotateKey: (providerId: string) => keyStore.rotateKey(providerId),
  importKeys: (payload: unknown) => keyStore.importKeys(payload),
  exportKeysStructured: () => keyStore.exportKeysStructured(),
  definition: AIKeyServiceDefinition,
  createInstance: () => createService(AIKeyServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await aiKeyInstance.start();
    return aiKeyInstance.call<TIn, TOut>(op, input);
  },
};

// 6. AIToolService
export const AIToolServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.aiTools',
  name: 'AIToolService',
  version: '1.0.0',
  operations: {
    listTools: {
      id: 'AIToolService.listTools',
      name: 'listTools',
      handler: async () => toolManagerService.listTools(),
    },
    execute: {
      id: 'AIToolService.execute',
      name: 'execute',
      handler: async (input: { toolName: string; args: Record<string, unknown> }) =>
        toolManagerService.execute(input.toolName, input.args),
    },
  },
});

const aiToolInstance: IService = createService(AIToolServiceDefinition);
export const AIToolServiceFacade = {
  id: AIToolServiceDefinition.id,
  name: AIToolServiceDefinition.name,
  version: AIToolServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: AIToolServiceDefinition,
  createInstance: () => createService(AIToolServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await aiToolInstance.start();
    return aiToolInstance.call<TIn, TOut>(op, input);
  },
};

