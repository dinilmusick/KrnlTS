import { z } from 'zod';

export const lifecyclePhaseSchema = z.enum([
  'created',
  'initializing',
  'mounted',
  'active',
  'suspended',
  'resuming',
  'disposing',
  'disposed',
  'failed',
]);

export type LifecyclePhase = z.infer<typeof lifecyclePhaseSchema>;

export interface LifecycleTransition {
  readonly from: LifecyclePhase;
  readonly to: LifecyclePhase;
}

const allowedTransitions: Record<LifecyclePhase, readonly LifecyclePhase[]> = {
  created: ['initializing', 'disposing'],
  initializing: ['mounted', 'failed', 'disposing'],
  mounted: ['active', 'suspended', 'disposing', 'failed'],
  active: ['suspended', 'disposing', 'failed'],
  suspended: ['resuming', 'disposing', 'failed'],
  resuming: ['active', 'failed', 'disposing'],
  disposing: ['disposed'],
  disposed: [],
  failed: ['initializing', 'disposing', 'disposed'],
};

export function canTransition(from: LifecyclePhase, to: LifecyclePhase): boolean {
  return allowedTransitions[from]?.includes(to) ?? false;
}

export class LifecycleError extends Error {
  constructor(readonly from: LifecyclePhase, readonly to: LifecyclePhase) {
    super(`Invalid FrnlTS lifecycle transition: ${from} -> ${to}`);
    this.name = 'LifecycleError';
  }
}

export interface LifecycleController {
  readonly phase: LifecyclePhase;
  transition(to: LifecyclePhase): void;
  subscribe(listener: (t: LifecycleTransition) => void): () => void;
}

export function createLifecycle(initial: LifecyclePhase = 'created'): LifecycleController {
  lifecyclePhaseSchema.parse(initial);
  let phase = initial;
  const listeners = new Set<(t: LifecycleTransition) => void>();

  return {
    get phase() {
      return phase;
    },
    transition(to: LifecyclePhase) {
      lifecyclePhaseSchema.parse(to);
      if (to === phase) {
        return;
      }
      if (!canTransition(phase, to)) {
        throw new LifecycleError(phase, to);
      }
      const transitionEvent: LifecycleTransition = { from: phase, to };
      phase = to;
      for (const listener of [...listeners]) {
        listener(transitionEvent);
      }
    },
    subscribe(listener: (t: LifecycleTransition) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export interface FrnlContract<
  Inputs extends Record<string, unknown> = Record<string, unknown>,
  Outputs extends Record<string, unknown> = Record<string, unknown>
> {
  readonly id: string;
  readonly version: number;
  readonly inputs?: Inputs;
  readonly outputs?: Outputs;
  readonly events?: readonly string[];
  readonly commands?: readonly string[];
  readonly capabilities?: readonly string[];
}

export const contractSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  inputs: z.record(z.string(), z.unknown()).optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
  events: z.array(z.string().min(1)).optional(),
  commands: z.array(z.string().min(1)).optional(),
  capabilities: z.array(z.string().min(1)).optional(),
});

export function defineContract<T extends FrnlContract>(contract: T): T {
  contractSchema.parse(contract);
  return Object.freeze({ ...contract });
}

export interface FrnlCapability {
  readonly id: string;
  readonly version: number;
  readonly provides?: readonly string[];
  readonly requires?: readonly string[];
}

export const capabilitySchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  provides: z.array(z.string().min(1)).optional(),
  requires: z.array(z.string().min(1)).optional(),
});

export function defineCapability<T extends FrnlCapability>(capability: T): T {
  capabilitySchema.parse(capability);
  return Object.freeze({ ...capability });
}

export interface FrnlFaultOptions {
  code: string;
  message: string;
  recoverable?: boolean;
  retryable?: boolean;
  cause?: unknown;
}

export class FrnlFault extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor(options: FrnlFaultOptions) {
    super(options.message);
    this.name = 'FrnlFault';
    this.code = options.code;
    this.recoverable = options.recoverable ?? false;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

export interface FrnlEffect<T = unknown> {
  readonly id: string;
  readonly run: (signal: AbortSignal) => Promise<T>;
}

export function defineEffect<T>(
  id: string,
  run: (signal: AbortSignal) => Promise<T>
): FrnlEffect<T> {
  z.string().min(1).parse(id);
  if (typeof run !== 'function') {
    throw new TypeError('Effect run must be a function');
  }
  return Object.freeze({ id, run });
}

export interface FrnlCommand<TPayload = unknown> {
  readonly id: string;
  readonly payload?: TPayload;
}

export function defineCommand<TPayload = unknown>(
  id: string,
  payload?: TPayload
): FrnlCommand<TPayload> {
  z.string().min(1).parse(id);
  return Object.freeze({ id, payload });
}