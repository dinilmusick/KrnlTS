/**
 * @file Orchestration.ts
 * @description Canonical declarative Orchestration compositor for KrnlTS services.
 * Aligned with Skipo Orchestration architecture.
 */

export interface OrchestrationDescriptor {
  id: string;
  name?: string;
  version?: string;
  description?: string;
}

export interface OrchestrationFlowStep {
  type: 'functionality' | 'orchestration';
  target: string;
  flow?: string;
}

export interface OrchestrationFlow {
  name: string;
  steps: OrchestrationFlowStep[];
  visibility: 'public' | 'private' | 'internal';
  thenFunctionality(funcName: string): OrchestrationFlow;
  thenOrchestration(orchestrationName: string, flowName?: string): OrchestrationFlow;
  register(options?: { visibility?: 'public' | 'private' | 'internal' }): OrchestrationFlow;
}

/**
 * Declarative Orchestration compositor.
 * Focused strictly on composing functionalities and other orchestrations into named flows.
 * Does not contain procedural algorithms, loops, or application-level configuration.
 */
export class Orchestration {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  private readonly flows: Map<string, OrchestrationFlow> = new Map();

  constructor(descriptor: OrchestrationDescriptor) {
    if (!descriptor || typeof descriptor !== 'object' || !descriptor.id) {
      throw new Error('[Orchestration] Valid orchestration descriptor with non-empty id is required.');
    }
    this.id = descriptor.id;
    this.name = descriptor.name || descriptor.id;
    this.version = descriptor.version || '1.0.0';
    this.description = descriptor.description || '';
  }

  flow(name: string): OrchestrationFlow {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('[Orchestration] Flow name must be a non-empty string.');
    }
    const chain: OrchestrationFlow = {
      name,
      steps: [],
      visibility: 'internal',
      thenFunctionality(funcName: string): OrchestrationFlow {
        if (!funcName || typeof funcName !== 'string') {
          throw new Error('[OrchestrationFlow] Functionality name must be a non-empty string.');
        }
        chain.steps.push({ type: 'functionality', target: funcName });
        return chain;
      },
      thenOrchestration(orchestrationName: string, flowName?: string): OrchestrationFlow {
        if (!orchestrationName || typeof orchestrationName !== 'string') {
          throw new Error('[OrchestrationFlow] Orchestration name must be a non-empty string.');
        }
        chain.steps.push({ type: 'orchestration', target: orchestrationName, flow: flowName });
        return chain;
      },
      register(options?: { visibility?: 'public' | 'private' | 'internal' }): OrchestrationFlow {
        if (options?.visibility) chain.visibility = options.visibility;
        return chain;
      },
    };
    this.flows.set(name, chain);
    return chain;
  }

  getFlow(name: string): OrchestrationFlow | undefined {
    return this.flows.get(name);
  }

  listFlows(): OrchestrationFlow[] {
    return Array.from(this.flows.values());
  }

  clearFlows(): void {
    this.flows.clear();
  }
}
