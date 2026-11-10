/**
 * @file FunctionalityOrchestration.ts
 * @description Canonical FunctionalityOrchestration for KrnlTS services.
 * Strictly scopes orchestration to functionalities belonging to ONE service.
 * Conforms to L1 (Plane Isolation) & Invariant: A service never orchestrates independent services.
 */

import { OrchestrationEventFacade } from '../events/OrchestrationEventFacade.js';
import type {
  OrchestrationStep,
  OrchestrationDescriptor,
  StepRetryPolicy,
  StepCondition,
  OrchestrationContext,
} from './canonical/model.js';
import { createFunctionalityFlow, type FunctionalityFlow } from './FunctionalityFlow.js';
import {
  addParallelFunctionalitySteps,
  addBranchFunctionalitySteps,
  addFanOutFunctionalityStep,
  assertFunctionalityServiceBoundary,
} from './FunctionalityOrchestrationSteps.js';
import { createFunctionalityOrchestrationDefinition } from './FunctionalityOrchestrationDefinition.js';

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
  public readonly bubbleEvents: boolean;
  public readonly events: OrchestrationEventFacade;


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
    this.bubbleEvents = descriptor.bubbleEvents ?? true;
    this.events = new OrchestrationEventFacade();
  }

  /**
   * Adds a sequential functionality step to the DAG.
   */
  thenFunctionality(funcName: any, options: FunctionalityStepOptions = {}): this {
    if (!funcName) {
      throw new Error('[FunctionalityOrchestration] Functionality name must be a non-empty string.');
    }
    if (typeof funcName !== 'string') {
      if (
        typeof funcName === 'object' &&
        ('call' in funcName || 'getStatus' in funcName || 'definition' in funcName || 'instance' in funcName || 'id' in funcName)
      ) {
        throw new Error(
          '[FunctionalityOrchestration] Invariant Violation: FunctionalityOrchestration only composes functionalities within the service, not independent services.'
        );
      }
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
  parallel(name: string, functionalityNames: readonly string[], options: { dependsOn?: string[] } = {}): this {
    addParallelFunctionalitySteps(this.steps, name, functionalityNames, options.dependsOn, (target) => this.assertServiceBoundary(target));
    return this;
  }

  branch(
    name: string,
    condition: StepCondition,
    thenFunc: string,
    elseFunc?: string,
    options: { dependsOn?: string[] } = {}
  ): this {
    addBranchFunctionalitySteps(this.steps, name, condition, thenFunc, elseFunc, options.dependsOn, (target) => this.assertServiceBoundary(target));
    return this;
  }

  fanOut(
    name: string,
    funcName: string,
    getItems: (ctx: OrchestrationContext) => unknown[] | Promise<unknown[]>,
    options: { dependsOn?: string[]; concurrency?: number } = {}
  ): this {
    addFanOutFunctionalityStep(this.steps, name, funcName, getItems, options, (target) => this.assertServiceBoundary(target));
    return this;
  }

  /**
   * Adds a nested orchestration step within the same service boundary.
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

  toDefinition(): import('./canonical/model.js').OrchestrationDefinition {
    return createFunctionalityOrchestrationDefinition({
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      timeoutMs: this.timeoutMs,
      bubbleEvents: this.bubbleEvents,
    }, this.steps);
  }

  flow(name: string): FunctionalityFlow {
    return createFunctionalityFlow(name, {
      assertServiceBoundary: (target) => this.assertServiceBoundary(target),
      thenFunctionality: (funcName, options) => this.thenFunctionality(funcName, options),
      thenFunctionalityOrchestration: (childName, options) => this.thenFunctionalityOrchestration(childName, options),
      register: (flow) => this.flows.set(name, flow),
    });
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
    assertFunctionalityServiceBoundary(target);
  }

}
