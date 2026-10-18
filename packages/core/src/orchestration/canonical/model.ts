/**
 * @file model.ts
 * @description Canonical Isomorphic Orchestration Model.
 * Provides unified schema and invariants for FunctionalityOrchestration (KrnlTS)
 * and ServiceOrchestration (Skipo).
 */

export type StepType =
  | 'task'
  | 'sequential'
  | 'parallel'
  | 'branch'
  | 'conditional'
  | 'fanOut'
  | 'fanIn'
  | 'diamond'
  | 'delay'
  | 'nested';

export type StepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SKIPPED'
  | 'TIMED_OUT';

export type StepExecutionStatus = StepStatus;

export type OrchestrationStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMED_OUT';

export interface StepRetryPolicy {
  readonly maxAttempts: number;
  readonly backoff?: 'linear' | 'exponential';
  readonly backoffMs?: number;
  readonly maxBackoffMs?: number;
  readonly jitter?: boolean;
  readonly retryOnErrors?: string[];
  readonly backoffMultiplier?: number;
  readonly initialDelayMs?: number;
}

export interface StepTimeoutPolicy {
  readonly timeoutMs: number;
}

export interface StepCompensation<TContext = OrchestrationContext> {
  readonly name?: string;
  readonly handler?: (context: TContext) => Promise<void>;
  readonly target?: string;
  readonly operation?: string;
}

export type SagaCompensationHandler<TOutput = unknown> = (
  output: TOutput,
  context: OrchestrationContext
) => Promise<void>;

export type StepCondition<TContext = OrchestrationContext> = (
  context: TContext
) => boolean | Promise<boolean>;

export interface OrchestrationStep<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly type: StepType;
  readonly target?: string;
  readonly operation?: string;
  readonly dependsOn?: readonly string[];
  readonly handler?: (input: TInput, context: OrchestrationContext) => Promise<TOutput>;
  readonly condition?: StepCondition;
  readonly thenStepId?: string;
  readonly elseStepId?: string;
  readonly parallelStepIds?: readonly string[];
  readonly getItems?: (context: OrchestrationContext) => unknown[] | Promise<unknown[]>;
  readonly concurrency?: number;
  readonly retryPolicy?: StepRetryPolicy;
  readonly timeoutPolicy?: StepTimeoutPolicy;
  readonly compensation?: StepCompensation;
  readonly catchHandler?: (error: Error, context: OrchestrationContext) => Promise<TOutput>;
  readonly nestedOrchestrationId?: string;
}

export interface OrchestrationDescriptor {
  readonly id: string;
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly timeoutMs?: number;
  readonly concurrency?: number;
  readonly scope?: 'functionality' | 'service';
}

export interface OrchestrationContext {
  readonly correlationId: string;
  readonly parentCorrelationId?: string;
  readonly orchestrationId: string;
  readonly executionId: string;
  readonly idempotencyKey?: string;
  readonly scope: 'functionality' | 'service';
  readonly serviceId?: string;
  readonly results: Record<string, unknown>;
  readonly metadata: Record<string, unknown>;
  readonly timestamp: number;
  isCancelled: boolean;
  abortSignal?: AbortSignal;
}

export interface StepExecutionResult<T = unknown> {
  readonly stepId: string;
  readonly status: StepStatus;
  readonly attempts: number;
  readonly output?: T;
  readonly error?: string;
  readonly startedAt: number;
  readonly completedAt: number;
}

export interface OrchestrationResult<T = unknown> {
  readonly orchestrationId: string;
  readonly correlationId: string;
  readonly status: OrchestrationStatus;
  readonly output?: T;
  readonly stepResults: Record<string, StepExecutionResult>;
  readonly error?: string;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly executionMetadata: Record<string, unknown>;
}

export interface DAGValidationResult {
  readonly valid: boolean;
  readonly order: readonly string[];
  readonly errors: readonly string[];
}

/**
 * Validates DAG structure: checks for existence, circular dependencies, and returns topological order.
 */
export function validateOrchestrationDAG(steps: readonly OrchestrationStep[]): DAGValidationResult {
  const errors: string[] = [];
  const stepMap = new Map<string, OrchestrationStep>();

  for (const step of steps) {
    if (stepMap.has(step.id)) {
      errors.push(`Duplicate step ID detected: "${step.id}"`);
    }
    stepMap.set(step.id, step);
  }

  // Check dependencies exist
  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!stepMap.has(dep)) {
          errors.push(`Step "${step.id}" depends on unknown step "${dep}".`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, order: [], errors };
  }

  // Topological sort with cycle detection (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  for (const step of steps) {
    inDegree.set(step.id, 0);
    graph.set(step.id, []);
  }

  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
        graph.get(dep)?.push(step.id);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== steps.length) {
    errors.push('Circular dependency cycle detected in orchestration DAG.');
    return { valid: false, order: [], errors };
  }

  return { valid: true, order, errors: [] };
}
