/**
 * @file model.ts
 * @description Canonical Isomorphic Orchestration Model.
 * Provides unified schema, serializable definition contracts, and invariants for
 * FunctionalityOrchestration (KrnlTS) and ServiceOrchestration (Skipo).
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
  readonly retryOnErrors?: readonly string[];
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

/**
 * Pure serializable definition of a step (Distributable through Kloks).
 * Free from arbitrary runtime closures.
 */
export interface OrchestrationFrontendReference {
  readonly component: string;
  readonly package?: string;
  readonly export?: string;
  readonly relationship?: 'recommended' | 'required';
}

export interface StepDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: StepType;
  readonly target?: string;
  readonly operation?: string;
  readonly dependsOn?: readonly string[];
  readonly conditionExpression?: string;
  readonly retryPolicy?: StepRetryPolicy;
  readonly timeoutPolicy?: StepTimeoutPolicy;
  readonly compensationTarget?: string;
  readonly compensationOperation?: string;
  readonly concurrency?: number;
  readonly nestedOrchestrationId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Pure serializable definition of an orchestration workflow (Distributable through Kloks).
 * Zero execution machinery, zero runtime closures.
 */
export interface OrchestrationDefinition<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly scope: 'functionality' | 'service';
  readonly bubbleEvents?: boolean;
  readonly dependencies: readonly string[];
  readonly defaultFrontend?: OrchestrationFrontendReference;
  readonly timeoutMs?: number;
  readonly concurrency?: number;
  readonly steps: readonly StepDefinition[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Runtime execution step representation with bound handlers.
 */
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
  readonly bubbleEvents?: boolean;
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
 * Validates DAG structure & semantic policies:
 * - Duplicate step IDs
 * - Missing dependencies
 * - Cycles / circular dependencies (topological sort via Kahn's algorithm)
 * - Negative or invalid timeouts
 * - Invalid retry policies (attempts < 1, negative backoff)
 * - Empty step targets
 * - Concurrency bounds
 */
export function validateOrchestrationDAG(steps: readonly OrchestrationStep[]): DAGValidationResult {
  const errors: string[] = [];
  const stepMap = new Map<string, OrchestrationStep>();

  for (const step of steps) {
    if (!step.id || typeof step.id !== 'string' || step.id.trim() === '') {
      errors.push('Step must have a non-empty string ID.');
      continue;
    }
    if (stepMap.has(step.id)) {
      errors.push(`Duplicate step ID detected: "${step.id}"`);
    }
    stepMap.set(step.id, step);

    // Validate timeouts
    if (step.timeoutPolicy) {
      if (typeof step.timeoutPolicy.timeoutMs !== 'number' || step.timeoutPolicy.timeoutMs <= 0) {
        errors.push(`Step "${step.id}" has invalid timeoutMs: must be a positive number.`);
      }
    }

    // Validate retry policy
    if (step.retryPolicy) {
      if (typeof step.retryPolicy.maxAttempts !== 'number' || step.retryPolicy.maxAttempts < 1) {
        errors.push(`Step "${step.id}" has invalid maxAttempts: must be >= 1.`);
      }
      if (step.retryPolicy.backoffMs !== undefined && step.retryPolicy.backoffMs < 0) {
        errors.push(`Step "${step.id}" has negative backoffMs.`);
      }
      if (step.retryPolicy.initialDelayMs !== undefined && step.retryPolicy.initialDelayMs < 0) {
        errors.push(`Step "${step.id}" has negative initialDelayMs.`);
      }
    }

    // Validate concurrency
    if (step.concurrency !== undefined && (typeof step.concurrency !== 'number' || step.concurrency < 1)) {
      errors.push(`Step "${step.id}" has invalid concurrency: must be >= 1.`);
    }

    // Validate step target
    if (step.type === 'task' || step.type === 'sequential') {
      if (!step.target && !step.handler) {
        errors.push(`Step "${step.id}" requires a non-empty target or handler.`);
      }
    }
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
