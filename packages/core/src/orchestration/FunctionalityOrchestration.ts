/**
 * @file FunctionalityOrchestration.ts
 * @description Canonical FunctionalityOrchestration for KrnlTS services.
 * Strictly scopes orchestration to functionalities belonging to ONE service.
 * Conforms to L1 (Plane Isolation) & Invariant: A service never orchestrates independent services.
 */

import {
  OrchestrationStep,
  OrchestrationDescriptor,
  StepRetryPolicy,
  StepTimeoutPolicy,
  StepCompensation,
  StepCondition,
  OrchestrationContext,
} from './canonical/model.js';

export interface FunctionalityFlowStep {
  readonly id: string;
  readonly type: 'functionality' | 'functionalityOrchestration';
  readonly target: string;
  readonly flow?: string;
  readonly dependsOn?: readonly string[];
  readonly retryPolicy?: StepRetryPolicy;
  readonly timeoutPolicy?: StepTimeoutPolicy;
}

export interface FunctionalityFlow {
  readonly name: string;
  readonly steps: FunctionalityFlowStep[];
  visibility: 'public' | 'private' | 'internal';
  thenFunctionality(
    funcName: string,
    options?: {
      retry?: StepRetryPolicy;
      timeoutMs?: number;
      dependsOn?: string[];
    }
  ): FunctionalityFlow;
  thenFunctionalityOrchestration(
    childOrchestrationName: string,
    flowName?: string
  ): FunctionalityFlow;
  register(options?: { visibility?: 'public' | 'private' | 'internal' }): FunctionalityFlow;
}

export interface FunctionalityStepOptions {
  id?: string;
  dependsOn?: string[];
  retry?: StepRetryPolicy;
  timeoutMs?: number;
  compensation?: string;
  catchHandler?: (err: Error, ctx: OrchestrationContext) => Promise<any>;
}

/**
 * FunctionalityOrchestration
 * Composes functionalities belonging strictly to ONE service into a deterministic DAG workflow.
 */
export class FunctionalityOrchestration {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;
  public readonly timeoutMs?: number;
  public readonly scope: 'functionality' = 'functionality';

  private readonly steps: OrchestrationStep[] = [];
  private readonly flows: Map<string, FunctionalityFlow> = new Map();

  constructor(descriptor: OrchestrationDescriptor) {
    if (!descriptor || typeof descriptor !== 'object' || !descriptor.id) {
      throw new Error('[FunctionalityOrchestration] Valid descriptor with non-empty id is required.');
    }
    this.id = descriptor.id;
    this.name = descriptor.name || descriptor.id;
    this.version = descriptor.version || '1.0.0';
    this.description = descriptor.description || '';
    this.timeoutMs = descriptor.timeoutMs;
  }

  /**
   * Adds a sequential functionality step to the DAG.
   */
  thenFunctionality(funcName: string, options: FunctionalityStepOptions = {}): this {
    if (!funcName || typeof funcName !== 'string') {
      throw new Error('[FunctionalityOrchestration] Functionality name must be a non-empty string.');
    }
    this.assertServiceBoundary(funcName);

    const stepId = options.id || `step_${funcName}_${this.steps.length + 1}`;
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : undefined;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);

    const step: OrchestrationStep = {
      id: stepId,
      name: funcName,
      type: 'task',
      target: funcName,
      dependsOn,
      retryPolicy: options.retry,
      timeoutPolicy: options.timeoutMs ? { timeoutMs: options.timeoutMs } : undefined,
      compensation: options.compensation ? { name: options.compensation, target: options.compensation } : undefined,
      catchHandler: options.catchHandler,
    };

    this.steps.push(step);
    return this;
  }

  /**
   * Adds parallel functionality steps to the DAG.
   */
  parallel(
    name: string,
    functionalityNames: readonly string[],
    options: { dependsOn?: string[] } = {}
  ): this {
    if (!name || typeof name !== 'string') {
      throw new Error('[FunctionalityOrchestration] Parallel group name must be a non-empty string.');
    }
    if (!functionalityNames || functionalityNames.length === 0) {
      throw new Error('[FunctionalityOrchestration] Parallel step requires at least one functionality.');
    }

    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : undefined;
    const baseDependsOn = options.dependsOn || (previousStep ? [previousStep] : []);

    const parallelStepIds: string[] = [];
    for (const funcName of functionalityNames) {
      this.assertServiceBoundary(funcName);
      const stepId = `${name}_${funcName}`;
      parallelStepIds.push(stepId);
      this.steps.push({
        id: stepId,
        name: funcName,
        type: 'task',
        target: funcName,
        dependsOn: baseDependsOn,
      });
    }

    // Join node
    const joinId = `${name}_join`;
    this.steps.push({
      id: joinId,
      name: `${name} Join`,
      type: 'fanIn',
      dependsOn: parallelStepIds,
    });

    return this;
  }

  /**
   * Adds conditional branching to the DAG.
   */
  branch(
    name: string,
    condition: StepCondition,
    thenFunc: string,
    elseFunc?: string,
    options: { dependsOn?: string[] } = {}
  ): this {
    this.assertServiceBoundary(thenFunc);
    if (elseFunc) this.assertServiceBoundary(elseFunc);

    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : undefined;
    const baseDependsOn = options.dependsOn || (previousStep ? [previousStep] : []);

    const thenStepId = `${name}_then_${thenFunc}`;
    this.steps.push({
      id: thenStepId,
      name: thenFunc,
      type: 'task',
      target: thenFunc,
      condition,
      dependsOn: baseDependsOn,
    });

    let joinDeps = [thenStepId];
    if (elseFunc) {
      const elseStepId = `${name}_else_${elseFunc}`;
      this.steps.push({
        id: elseStepId,
        name: elseFunc,
        type: 'task',
        target: elseFunc,
        condition: async (ctx) => !(await condition(ctx)),
        dependsOn: baseDependsOn,
      });
      joinDeps.push(elseStepId);
    }

    const joinId = `${name}_join`;
    this.steps.push({
      id: joinId,
      name: `${name} Join`,
      type: 'fanIn',
      dependsOn: joinDeps,
    });

    return this;
  }

  /**
   * Adds fan-out step processing items through a functionality.
   */
  fanOut(
    name: string,
    funcName: string,
    getItems: (ctx: OrchestrationContext) => unknown[] | Promise<unknown[]>,
    options: { dependsOn?: string[]; concurrency?: number } = {}
  ): this {
    this.assertServiceBoundary(funcName);
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : undefined;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);

    this.steps.push({
      id: name,
      name,
      type: 'fanOut',
      target: funcName,
      getItems,
      concurrency: options.concurrency ?? 5,
      dependsOn,
    });
    return this;
  }

  /**
   * Nested orchestration: Invokes a child FunctionalityOrchestration within the same service boundary.
   */
  thenFunctionalityOrchestration(
    childOrchId: string,
    options: FunctionalityStepOptions = {}
  ): this {
    if (!childOrchId || typeof childOrchId !== 'string') {
      throw new Error('[FunctionalityOrchestration] Child orchestration id must be a non-empty string.');
    }
    const stepId = options.id || `nested_${childOrchId}_${this.steps.length + 1}`;
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : undefined;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);

    this.steps.push({
      id: stepId,
      name: childOrchId,
      type: 'nested',
      nestedOrchestrationId: childOrchId,
      dependsOn,
      retryPolicy: options.retry,
      timeoutPolicy: options.timeoutMs ? { timeoutMs: options.timeoutMs } : undefined,
    });
    return this;
  }

  getSteps(): readonly OrchestrationStep[] {
    return Object.freeze([...this.steps]);
  }

  /**
   * Named flow builder interface.
   */
  flow(name: string): FunctionalityFlow {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('[FunctionalityOrchestration] Flow name must be a non-empty string.');
    }

    const steps: FunctionalityFlowStep[] = [];
    const self = this;

    const flowInstance: FunctionalityFlow = {
      name,
      steps,
      visibility: 'internal',
      thenFunctionality(funcName: string, options?: { retry?: StepRetryPolicy; timeoutMs?: number; dependsOn?: string[] }): FunctionalityFlow {
        if (!funcName || typeof funcName !== 'string') {
          throw new Error('[FunctionalityFlow] Functionality name must be a non-empty string.');
        }
        self.assertServiceBoundary(funcName);
        const stepId = `${name}_${funcName}_${steps.length + 1}`;
        steps.push({
          id: stepId,
          type: 'functionality',
          target: funcName,
          dependsOn: options?.dependsOn,
          retryPolicy: options?.retry,
          timeoutPolicy: options?.timeoutMs ? { timeoutMs: options?.timeoutMs } : undefined,
        });
        self.thenFunctionality(funcName, {
          id: stepId,
          retry: options?.retry,
          timeoutMs: options?.timeoutMs,
          dependsOn: options?.dependsOn,
        });
        return flowInstance;
      },
      thenFunctionalityOrchestration(childName: string, flowName?: string): FunctionalityFlow {
        if (!childName || typeof childName !== 'string') {
          throw new Error('[FunctionalityFlow] Orchestration name must be a non-empty string.');
        }
        const stepId = `${name}_orch_${childName}_${steps.length + 1}`;
        steps.push({
          id: stepId,
          type: 'functionalityOrchestration',
          target: childName,
          flow: flowName,
        });
        self.thenFunctionalityOrchestration(childName, { id: stepId });
        return flowInstance;
      },
      register(options?: { visibility?: 'public' | 'private' | 'internal' }): FunctionalityFlow {
        if (options?.visibility) flowInstance.visibility = options.visibility;
        return flowInstance;
      },
    };

    this.flows.set(name, flowInstance);
    return flowInstance;
  }

  getFlow(name: string): FunctionalityFlow | undefined {
    return this.flows.get(name);
  }

  listFlows(): FunctionalityFlow[] {
    return Array.from(this.flows.values());
  }

  clearFlows(): void {
    this.flows.clear();
    this.steps.length = 0;
  }

  private assertServiceBoundary(target: string): void {
    // Law L1: FunctionalityOrchestration MUST NOT orchestrate independent services.
    if (target.includes('Service') && !target.includes('Functionality') && !target.includes('Atom')) {
      if (target.endsWith('ServiceFacade') || target.startsWith('service.') || target.includes('Service.')) {
        throw new Error(
          `[FunctionalityOrchestration] Plane Isolation Invariant Violation: Target "${target}" appears to be an external Service. FunctionalityOrchestration strictly composes functionalities inside ONE service.`
        );
      }
    }
  }
}
