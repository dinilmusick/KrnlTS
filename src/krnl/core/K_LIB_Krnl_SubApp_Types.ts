/**
 * @file K_LIB_Krnl_SubApp_Types.ts
 * @description Core types and contracts for Krnl Sub-App integration.
 *
 * Governing Principles:
 * - Sub-App owns: UI, business logic, internal backend, endpoint/operation implementations, app dependencies.
 * - Krnl owns: discovery, registration, lifecycle, ecosystem integration, transport exposure, shared services, and flow orchestration.
 * - Zero-Server Rule: Sub-apps NEVER start their own HTTP/WebSocket servers or bind listening ports.
 * - Functionality Wrapping: Sub-app operations wrap as first-class functionalities on the host Entity.
 */

import type { Logger } from "./K_LIB_Krnl_Base_Concepts.js";

/**
 * Sub-App Manifest declaring dependencies, required services, registration entry, and runtime metadata.
 */
export interface SubAppManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  registrationEntry?: string; // e.g. './register.js' or './index.js'
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  buildRequirements?: string[];
  requiredServices?: string[];
  runtimeMetadata?: Record<string, unknown>;
  ui?: SubAppUIConfig | string;
}

/**
 * Sub-app filesystem descriptor.
 */
export interface SubAppDescriptor {
  id: string;
  path: string;
  manifestPath?: string;
  registrationPath: string;
  manifest?: SubAppManifest;
}

/**
 * Execution context supplied to an operation handler when invoked.
 */
export interface SubAppExecutionContext {
  caller?: string;
  callerPort?: number;
  accessKey?: string;
  entity?: any;
  services?: ServiceContainer;
  metadata?: Record<string, unknown>;
}

/**
 * Operation handler function signature.
 */
export type OperationHandler<TInput = any, TOutput = any> = (
  input: TInput,
  context: SubAppExecutionContext
) => Promise<TOutput> | TOutput;

/**
 * Declarative Operation definition exposing transport-independent capability.
 */
export interface OperationDefinition {
  name: string;
  description?: string;
  input?: any; // Zod schema, Protobuf verifier, or validator function
  output?: any;
  handler: OperationHandler;
  metadata?: Record<string, unknown>;
  method?: string; // Optional HTTP method suggestion: 'POST' | 'GET', defaults to 'POST'
  visibility?: 'public' | 'protected' | 'private';
}

/**
 * UI configuration descriptor for sub-apps.
 */
export interface SubAppUIConfig {
  entryPath?: string; // Path to UI bundle / index.html / component entry
  title?: string;
  icon?: string;
  routePrefix?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Shared services container injected into sub-apps.
 */
export interface ServiceContainer {
  get<T = any>(serviceName: string): T | undefined;
  has(serviceName: string): boolean;
  register<T = any>(serviceName: string, serviceInstance: T): void;
  list(): string[];
}

/**
 * Operation registrar interface injected into sub-apps during registration.
 */
export interface OperationRegistrar {
  register(op: OperationDefinition): void;
  registerBatch(ops: OperationDefinition[]): void;
  get(opName: string): OperationDefinition | undefined;
  list(): OperationDefinition[];
}

/**
 * Event registrar interface injected into sub-apps during registration.
 */
export interface EventRegistrar {
  emit(eventName: string, data: any): void;
  on(eventName: string, listener: (data: any) => void): () => void;
}

/**
 * Dependency-injected registration context passed to SubApp.register(context).
 */
export interface SubAppRegistrationContext {
  entity: any;
  services: ServiceContainer;
  operations: OperationRegistrar;
  events: EventRegistrar;
  config: Record<string, unknown>;
  logger: Logger;
}

/**
 * Return contract from SubApp.register(context).
 */
export interface SubAppRegistration {
  name?: string;
  operations: OperationDefinition[];
  ui?: SubAppUIConfig | string;
  metadata?: Record<string, unknown>;
  onInitialize?: (context: SubAppRegistrationContext) => Promise<void> | void;
  onDispose?: () => Promise<void> | void;
}

/**
 * Sub-App module contract.
 */
export interface SubAppModule {
  manifest?: SubAppManifest;
  register: (context: SubAppRegistrationContext) => SubAppRegistration | Promise<SubAppRegistration>;
  default?: ((context: SubAppRegistrationContext) => SubAppRegistration | Promise<SubAppRegistration>) | {
    manifest?: SubAppManifest;
    register?: (context: SubAppRegistrationContext) => SubAppRegistration | Promise<SubAppRegistration>;
  };
}

/**
 * Lifecycle states of a sub-app instance.
 */
export type SubAppLifecycleState =
  | 'DISCOVERED'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'LOADING'
  | 'REGISTERED'
  | 'INITIALIZING'
  | 'READY'
  | 'UNREGISTERING'
  | 'DISPOSED'
  | 'ERROR';

/**
 * Structured error details for sub-app validation and execution failures.
 */
export interface SubAppErrorDetail {
  code: string;
  message: string;
  field?: string;
  subAppId?: string;
  operationName?: string;
}

/**
 * Runtime sub-app instance managed by an Entity.
 */
export interface SubAppInstance {
  id: string;
  state: SubAppLifecycleState;
  manifest: SubAppManifest;
  descriptor: SubAppDescriptor;
  registration?: SubAppRegistration;
  operations: Map<string, OperationDefinition>;
  error?: Error | null;
  errorDetails?: SubAppErrorDetail[];
  loadedAt?: number;
  readyAt?: number;
  dispose?: () => Promise<void>;
}
