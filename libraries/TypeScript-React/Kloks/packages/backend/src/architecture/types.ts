/**
 * @file types.ts
 * @description Formal TypeScript types and contracts for APP_ARCHITECTURE_SPEC.
 * Conforms strictly to Inviolable Law L7 and < 200 lines limit.
 */

export type Runtime = 'client' | 'server';
export type Deployment = 'local' | 'remote';

export type FunctionSet = Record<string, (...args: any[]) => any>;

export interface ServiceDefinition<T extends FunctionSet = FunctionSet> {
  name: string;
  version?: string;
  runtime: Runtime;
  deployment: Deployment;
  facade: T;
  metadata?: Record<string, unknown>;
}

export interface ServiceFacade<T extends FunctionSet = FunctionSet> {
  runtime: Runtime;
  deployment: Deployment;
  service: T;
}

export type OrchestrationFn = (...args: any[]) => Promise<any> | any;

export interface BackendFacade<
  TServices extends Record<string, any> = Record<string, any>,
  TOrchestrations extends Record<string, OrchestrationFn> = Record<string, OrchestrationFn>
> {
  services: TServices;
  orchestrations: TOrchestrations;
}

/**
 * Validates that a ServiceDefinition satisfies the mathematical invariants:
 * 1. deployment == "remote" => runtime == "server"
 * 2. runtime == "client" => deployment == "local"
 */
export function validateServiceDefinition(def: {
  name?: string;
  runtime: Runtime;
  deployment: Deployment;
}): { valid: boolean; error?: string } {
  if (def.deployment === 'remote' && def.runtime !== 'server') {
    return {
      valid: false,
      error: `Invalid service configuration for '${def.name || 'unnamed'}': remote deployment requires 'server' runtime (received runtime='${def.runtime}')`,
    };
  }
  if (def.runtime === 'client' && def.deployment !== 'local') {
    return {
      valid: false,
      error: `Invalid service configuration for '${def.name || 'unnamed'}': client runtime requires 'local' deployment (received deployment='${def.deployment}')`,
    };
  }
  return { valid: true };
}

/**
 * Registry interface for service records in Gateway
 */
export interface ServiceRegistryRecord {
  id: string;
  name: string;
  version: string;
  runtime: Runtime;
  deployment: Deployment;
  endpoint?: string;
  protocol?: 'http' | 'ws' | 'in-process';
  health?: 'healthy' | 'degraded' | 'unhealthy';
  metadata?: Record<string, unknown>;
}
