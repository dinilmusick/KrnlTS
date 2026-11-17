/**
 * @file BackendClient.ts
 * @description Canonical frontend client exposing unified dynamic domain proxy facade across local and remote runtimes.
 */

import { BackendResolver } from './BackendResolver.js';
import { FrontendSession } from './FrontendSession.js';
import { Message, Job, Delegation, CallbackHandle } from './types.js';

export interface BackendClientOptions {
  resolver: BackendResolver;
  session?: FrontendSession;
}

export interface DomainProxy {
  on: (event: string, handler: (event: Message) => void) => () => void;
  subscribe: (channel: string, handler: (event: Message) => void) => () => void;
  execute: <T = any, R = any>(op: string, payload?: T) => Promise<R>;
  delegate: <T = any, R = any>(op: string, payload: T, callback?: (...args: any[]) => any) => Promise<R>;
  [operation: string]: any;
}

export class BackendClient {
  public readonly resolver: BackendResolver;
  public readonly session: FrontendSession;
  private domainProxies = new Map<string, DomainProxy>();

  constructor(options: BackendClientOptions) {
    this.resolver = options.resolver;
    this.session = options.session || new FrontendSession();

    // Return an ES6 Proxy so any domain access (e.g. backend.users, backend.storage) returns a DomainProxy
    return new Proxy(this, {
      get: (target: any, prop: string | symbol) => {
        if (typeof prop === 'symbol' || prop in target) {
          return target[prop];
        }
        return target.domain(String(prop));
      },
    });
  }

  domain(domainName: string): DomainProxy {
    if (!this.domainProxies.has(domainName)) {
      const proxy = this.createDomainProxy(domainName);
      this.domainProxies.set(domainName, proxy);
    }
    return this.domainProxies.get(domainName)!;
  }

  private createDomainProxy(domain: string): DomainProxy {
    const handler: any = {
      on: (event: string, fn: (event: Message) => void) => {
        return this.on(`${domain}.${event}`, fn);
      },
      subscribe: (channel: string, fn: (event: Message) => void) => {
        return this.subscribe(channel.includes('.') ? channel : `${domain}.${channel}`, fn);
      },
      execute: async <T = any, R = any>(op: string, payload?: T): Promise<R> => {
        const executor = await this.resolver.resolve();
        return await executor.execute<T, R>({
          id: `cmd-${Date.now()}`,
          type: 'COMMAND',
          operation: `${domain}.${op}`,
          payload,
          sessionId: this.session.sessionId,
          timestamp: Date.now(),
        });
      },
      delegate: async <T = any, R = any>(op: string, payload: T, callback?: (...args: any[]) => any): Promise<R> => {
        const executor = await this.resolver.resolve();
        let callbackHandle: CallbackHandle | undefined;
        if (callback) {
          callbackHandle = executor.registerCallback(callback);
        }
        const delegation: Delegation<T> = {
          target: domain,
          operation: op,
          payload,
          callbackHandle,
          sessionId: this.session.sessionId,
        };
        return await executor.delegate<T, R>(delegation);
      },
    };

    return new Proxy(handler, {
      get: (target: any, prop: string | symbol) => {
        if (typeof prop === 'symbol' || prop in target) {
          return target[prop];
        }
        // Dynamic operation call: backend.<domain>.<operation>(payload)
        return async (payload?: any) => {
          return await target.execute(String(prop), payload);
        };
      },
    });
  }

  on(eventPattern: string, handler: (event: Message) => void): () => void {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const attach = (executor: any) => {
      if (cancelled) return;
      cleanup = executor.subscribe(eventPattern, handler);
      this.session.trackSubscription(cleanup!);
    };

    const active = this.resolver.getActiveExecutor();
    if (active) {
      attach(active);
    } else {
      this.resolver.resolve().then(attach);
    }

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }

  subscribe(channel: string, handler: (event: Message) => void): () => void {
    return this.on(channel, handler);
  }

  get jobs() {
    return {
      submit: async <T = any, R = any>(job: Partial<Job<T, R>> & { type: string; payload: T }): Promise<Job<T, R>> => {
        const executor = await this.resolver.resolve();
        return await executor.submitJob<T, R>({
          ...job,
          sessionId: this.session.sessionId,
        });
      },
    };
  }

  async health() {
    return await this.resolver.health();
  }
}

export function createBackendClient(options: BackendClientOptions): BackendClient & Record<string, DomainProxy> {
  return new BackendClient(options) as any;
}
