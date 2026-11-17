/** Portable backend surface. Node filesystem, database, server and service engines are exposed from the explicit /node adapter. */
export * from './api/index.js';
export * from './auth/CanonicalAuthClient.js';
export * from './storage/index.js';
export * from './workspace/index.js';
export * from './connectivity/index.js';
export * from './services/index.js';
export * from './resolver/index.js';
export type {
  Runtime, Deployment, FunctionSet, ServiceFacade, OrchestrationFn,
  BackendFacade, ServiceRegistryRecord,
} from './architecture/types.js';
