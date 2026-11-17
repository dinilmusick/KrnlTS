import type { StepRetryPolicy, StepTimeoutPolicy } from './canonical/model.js';

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

export interface FunctionalityFlowOwner {
  assertServiceBoundary(target: string): void;
  thenFunctionality(
    funcName: any,
    options?: { id?: string; retry?: StepRetryPolicy; timeoutMs?: number; dependsOn?: string[] }
  ): unknown;
  thenFunctionalityOrchestration(childName: string, options?: { id?: string }): unknown;
  register(flow: FunctionalityFlow): void;
}

export function createFunctionalityFlow(name: string, owner: FunctionalityFlowOwner): FunctionalityFlow {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('[FunctionalityOrchestration] Flow name must be a non-empty string.');
  }

  const steps: FunctionalityFlowStep[] = [];
  const self = owner;

  const flowInstance: FunctionalityFlow = {
    name,
    steps,
    visibility: 'internal',
    thenFunctionality(funcName: any, options?: { retry?: StepRetryPolicy; timeoutMs?: number; dependsOn?: string[] }): FunctionalityFlow {
      if (!funcName) {
        throw new Error('[FunctionalityFlow] Functionality name must be a non-empty string.');
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

  owner.register(flowInstance);
  return flowInstance;
}
