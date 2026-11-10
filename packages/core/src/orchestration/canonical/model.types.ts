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
