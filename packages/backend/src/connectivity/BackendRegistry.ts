/**
 * @file BackendRegistry.ts
 * @description Central capability registry aggregating commands, queries, events, callbacks, and jobs.
 */

import {
  BackendContract,
  DomainContract,
  OperationDefinition,
  JobDefinition,
  createEmptyContract,
} from './BackendContract.js';

export class BackendRegistry {
  private contract: BackendContract;

  constructor(version = '1.0.0') {
    this.contract = createEmptyContract(version);
  }

  private ensureDomain(domain: string): DomainContract {
    if (!this.contract.domains[domain]) {
      this.contract.domains[domain] = {
        domain,
        commands: {},
        queries: {},
        events: {},
        callbacks: {},
        jobs: {},
      };
    }
    return this.contract.domains[domain];
  }

  registerCapability(capabilityName: string): this {
    if (!this.contract.capabilities.includes(capabilityName)) {
      this.contract.capabilities.push(capabilityName);
    }
    return this;
  }

  registerCommand<TInput = unknown, TOutput = unknown>(
    domain: string,
    name: string,
    handler: (input: TInput, context?: unknown) => Promise<TOutput> | TOutput,
    description?: string
  ): this {
    const d = this.ensureDomain(domain);
    d.commands[name] = { domain, name, handler: handler as any, description };
    return this;
  }

  registerQuery<TInput = unknown, TOutput = unknown>(
    domain: string,
    name: string,
    handler: (input: TInput, context?: unknown) => Promise<TOutput> | TOutput,
    description?: string
  ): this {
    const d = this.ensureDomain(domain);
    d.queries[name] = { domain, name, handler: handler as any, description };
    return this;
  }

  registerEvent(domain: string, name: string, description?: string): this {
    const d = this.ensureDomain(domain);
    d.events[name] = { domain, name, description };
    return this;
  }

  registerCallback(
    domain: string,
    name: string,
    handler?: (...args: any[]) => any,
    description?: string
  ): this {
    const d = this.ensureDomain(domain);
    d.callbacks[name] = { domain, name, handler, description };
    return this;
  }

  registerJob<TPayload = unknown, TResult = unknown>(
    domain: string,
    type: string,
    handler: (payload: TPayload, context?: unknown) => Promise<TResult> | TResult,
    description?: string
  ): this {
    const d = this.ensureDomain(domain);
    d.jobs[type] = { domain, type, handler: handler as any, description };
    return this;
  }

  getCommand(domain: string, name: string): OperationDefinition | undefined {
    return this.contract.domains[domain]?.commands[name];
  }

  getQuery(domain: string, name: string): OperationDefinition | undefined {
    return this.contract.domains[domain]?.queries[name];
  }

  getJob(domain: string, type: string): JobDefinition | undefined {
    return this.contract.domains[domain]?.jobs[type];
  }

  exposeContract(): BackendContract {
    const sanitized: BackendContract = {
      version: this.contract.version,
      capabilities: [...this.contract.capabilities],
      domains: {},
    };

    for (const [domName, dom] of Object.entries(this.contract.domains)) {
      sanitized.domains[domName] = {
        domain: domName,
        commands: Object.fromEntries(
          Object.entries(dom.commands).map(([k, v]) => [k, { name: v.name, domain: v.domain, description: v.description }])
        ),
        queries: Object.fromEntries(
          Object.entries(dom.queries).map(([k, v]) => [k, { name: v.name, domain: v.domain, description: v.description }])
        ),
        events: { ...dom.events },
        callbacks: Object.fromEntries(
          Object.entries(dom.callbacks).map(([k, v]) => [k, { name: v.name, domain: v.domain, description: v.description }])
        ),
        jobs: Object.fromEntries(
          Object.entries(dom.jobs).map(([k, v]) => [k, { type: v.type, domain: v.domain, description: v.description }])
        ),
      };
    }

    return sanitized;
  }
}
