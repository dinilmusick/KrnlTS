// ══════════════════════════════════════════════════════════════════════════════
// KLOKS SERVICES: CONSOLIDATED QWNSR CLIENT/UNIVERSAL SERVICES & KRNLTS FACADES
// ══════════════════════════════════════════════════════════════════════════════

import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';

export * from './authService.js';
export * from './storageService.js';
export * from './systemDbService.js';
export * from './authService/auth.ui.js';
export * from './storageService/storage.ui.js';
export * from './systemDb.ui.js';
export * from './monacoIdeService.js';
export * from './uiAuthoringService.js';
export * from './srklAccountService.js';

import { authService } from './authService.js';
import { storageService } from './storageService.js';
import { systemDbService } from './systemDbService.js';
import { AuthServiceUISchema } from './authService/auth.ui.js';
import { StorageServiceUISchema } from './storageService/storage.ui.js';
import { SystemDbServiceUISchema } from './systemDb.ui.js';

export const AuthClientServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.service.auth',
  name: 'AuthClientService',
  version: '1.0.0',
  operations: {
    getState: {
      id: 'AuthClientService.getState',
      name: 'getState',
      handler: async () => authService.getState(),
    },
  },
});

const authClientInstance: IService = createService(AuthClientServiceDefinition);

export const AuthClientServiceFacade = {
  id: AuthClientServiceDefinition.id,
  name: AuthClientServiceDefinition.name,
  version: AuthClientServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: AuthClientServiceDefinition,
  service: authService,
  ui: AuthServiceUISchema,
  createInstance: () => createService(AuthClientServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await authClientInstance.start();
    return authClientInstance.call<TIn, TOut>(op, input);
  },
};

export const StorageClientServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.service.storage',
  name: 'StorageClientService',
  version: '1.0.0',
  operations: {
    getConnections: {
      id: 'StorageClientService.getConnections',
      name: 'getConnections',
      handler: async () => storageService.getConnections(),
    },
  },
});

const storageClientInstance: IService = createService(StorageClientServiceDefinition);

export const StorageClientServiceFacade = {
  id: StorageClientServiceDefinition.id,
  name: StorageClientServiceDefinition.name,
  version: StorageClientServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: StorageClientServiceDefinition,
  service: storageService,
  ui: StorageServiceUISchema,
  createInstance: () => createService(StorageClientServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await storageClientInstance.start();
    return storageClientInstance.call<TIn, TOut>(op, input);
  },
};

export const SystemDbClientServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.service.systemDb',
  name: 'SystemDbClientService',
  version: '1.0.0',
  operations: {
    getEnvStatus: {
      id: 'SystemDbClientService.getEnvStatus',
      name: 'getEnvStatus',
      handler: async () => { await systemDbService.refreshStatus(); return systemDbService.getEnvStatus(); },
    },
    getTelemetry: {
      id: 'SystemDbClientService.getTelemetry',
      name: 'getTelemetry',
      handler: async () => { await systemDbService.refreshStatus(); return systemDbService.getTelemetry(); },
    },
  },
});

const systemDbClientInstance: IService = createService(SystemDbClientServiceDefinition);

export const SystemDbClientServiceFacade = {
  id: SystemDbClientServiceDefinition.id,
  name: SystemDbClientServiceDefinition.name,
  version: SystemDbClientServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: SystemDbClientServiceDefinition,
  service: systemDbService,
  ui: SystemDbServiceUISchema,
  createInstance: () => createService(SystemDbClientServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await systemDbClientInstance.start();
    return systemDbClientInstance.call<TIn, TOut>(op, input);
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// KRNL CANONICAL CLIENT SERVICE EXPORTS (Standardized krnl* Prefix Rule)
// ══════════════════════════════════════════════════════════════════════════════
export const krnlAuthClientServiceDefinition = AuthClientServiceDefinition;
export const krnlAuthClientServiceFacade = AuthClientServiceFacade;
export const krnlStorageClientServiceDefinition = StorageClientServiceDefinition;
export const krnlStorageClientServiceFacade = StorageClientServiceFacade;
export const krnlSystemDbClientServiceDefinition = SystemDbClientServiceDefinition;
export const krnlSystemDbClientServiceFacade = SystemDbClientServiceFacade;

