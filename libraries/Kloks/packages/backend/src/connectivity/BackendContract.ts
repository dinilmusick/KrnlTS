/**
 * @file BackendContract.ts
 * @description Canonical public surface contracts and capability schema definitions.
 */

export interface OperationDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  domain: string;
  description?: string;
  handler?: (input: TInput, context?: unknown) => Promise<TOutput> | TOutput;
}

export interface EventDefinition<TPayload = unknown> {
  name: string;
  domain: string;
  description?: string;
  payloadType?: TPayload;
}

export interface CallbackDefinition<TArgs = unknown[], TReturn = unknown> {
  name: string;
  domain: string;
  description?: string;
  handler?: (...args: TArgs[]) => Promise<TReturn> | TReturn;
}

export interface JobDefinition<TPayload = unknown, TResult = unknown> {
  type: string;
  domain: string;
  description?: string;
  handler?: (payload: TPayload, jobContext?: unknown) => Promise<TResult> | TResult;
}

export interface DomainContract {
  domain: string;
  commands: Record<string, OperationDefinition>;
  queries: Record<string, OperationDefinition>;
  events: Record<string, EventDefinition>;
  callbacks: Record<string, CallbackDefinition>;
  jobs: Record<string, JobDefinition>;
}

export interface BackendContract {
  version: string;
  domains: Record<string, DomainContract>;
  capabilities: string[];
}

export function createEmptyContract(version = '1.0.0'): BackendContract {
  return {
    version,
    domains: {},
    capabilities: [],
  };
}
