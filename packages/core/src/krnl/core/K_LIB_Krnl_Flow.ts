/**
 * @file K_LIB_Krnl_Flow.ts
 * @description In-Entity Flow & Orchestration Engine.
 *
 * An OrchestrationChain represents the orchestration of functionalities and global library functions inside an Entity.
 * Governing Rules:
 * 1. An Entity orchestrates only two types of nodes:
 *    - Functionality Node: atomic functionality local to the entity
 *    - Function Node: pure domain function imported from a global library (src/libraries/*)
 * 2. Strict 2-Function Rule:
 *    No more than 2 global function calls can occur consecutively between two functionality calls:
 *    Functionality1 -> GlobalFn1 -> GlobalFn2 -> Functionality2 (Valid)
 *    Functionality1 -> GlobalFn1 -> Functionality2 (Valid)
 *    Functionality1 -> Functionality2 (Valid & Preferred)
 *    Functionality1 -> GlobalFn1 -> GlobalFn2 -> GlobalFn3 (VIOLATION - Throws OrchestrationRuleViolationError)
 * 3. Flow control (branching, merging, switching) is built into the parent class and never written procedurally by users.
 */

import type { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
import type { krnlLocalFunctionality, KrnlFunctionalityManifest } from "./K_LIB_Krnl_Functionality_Types.js";
import type { KrnlUiSpec } from "./types.js";
import { KrnlEntityRegistry } from "./K_LIB_Krnl_Entity_Registry.js";

export class OrchestrationRuleViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrchestrationRuleViolationError';
  }
}

export type GlobalFunctionRef = ((arg: any) => any) | { name: string; fn: (arg: any) => any; libName?: string };

export interface KrnlFlowStep {
  type: 'functionality' | 'entityOrchestration' | 'function' | 'branch' | 'switch' | 'merge' | 'parallel';
  fid?: string;
  targetEntity?: string | krnlEntityBase;
  targetOrchestration?: string;
  fn?: (arg: any) => any;
  fnName?: string;
  libName?: string;
  pred?: (out: any) => boolean;
  trueChain?: OrchestrationChain | string;
  falseChain?: OrchestrationChain | string;
  keyFn?: (out: any) => string;
  cases?: Record<string, OrchestrationChain | string>;
  defaultCase?: OrchestrationChain | string;
  mergeBranches?: string[];
  parallelSteps?: Array<{ type: 'functionality' | 'function'; target: string | ((arg: any) => any) }>;
}

export class OrchestrationChain {
  protected entity: krnlEntityBase;
  protected id: string;
  protected steps: KrnlFlowStep[] = [];
  protected consecutiveFunctionCalls: number = 0;

  constructor(entity: krnlEntityBase, id: string) {
    this.entity = entity;
    this.id = id;
  }

  /**
   * Chain a local functionality call on the entity.
   * Resets the consecutive function call counter to 0.
   */
  thenFunctionality(fid: string): this {
    this.steps.push({ type: 'functionality', fid });
    this.consecutiveFunctionCalls = 0;
    return this;
  }

  /**
   * Sequential alias for thenFunctionality.
   */
  then(fid: string): this {
    return this.thenFunctionality(fid);
  }

  /**
   * Chain an orchestration or capability on another entity.
   * Enables cross-entity orchestration in the flat multi-entity architecture.
   */
  thenEntityOrchestration(entityNameOrInstance: string | krnlEntityBase, orchestrationId: string): this {
    this.steps.push({
      type: 'entityOrchestration',
      targetEntity: entityNameOrInstance,
      targetOrchestration: orchestrationId
    });
    this.consecutiveFunctionCalls = 0;
    return this;
  }

  /**
   * Short alias for thenEntityOrchestration.
   */
  thenEntity(entityNameOrInstance: string | krnlEntityBase, orchestrationId: string): this {
    return this.thenEntityOrchestration(entityNameOrInstance, orchestrationId);
  }

  /**
   * Chain an imported global library function call.
   * In the flat multi-entity architecture, entities must not call libraries directly;
   * only functionalities can call shared libraries.
   */
  thenFunction(fnOrRef: ((arg: any) => any) | string, libName?: string): this {
    throw new OrchestrationRuleViolationError(
      `Orchestration Rule Violation in chain '${this.id}': Entities must not call libraries directly. Entities may only orchestrate functionalities (thenFunctionality) and orchestrations from other entities (thenEntityOrchestration). Delegate reusable logic into a shared functionality in src/functionalities/ or call the library from inside a functionality.`
    );
  }

  /**
   * Built-in Flow Control: Branching
   * Evaluates predicate; routes output to trueBranch or falseBranch.
   */
  branch(
    pred: (out: any) => boolean,
    trueBranch: string | ((chain: OrchestrationChain) => void),
    falseBranch?: string | ((chain: OrchestrationChain) => void)
  ): this {
    let resolvedTrue: OrchestrationChain | string;
    if (typeof trueBranch === 'function') {
      const sub = new OrchestrationChain(this.entity, `${this.id}_branch_true`);
      trueBranch(sub);
      resolvedTrue = sub;
    } else {
      resolvedTrue = trueBranch;
    }

    let resolvedFalse: OrchestrationChain | string | undefined = undefined;
    if (falseBranch) {
      if (typeof falseBranch === 'function') {
        const sub = new OrchestrationChain(this.entity, `${this.id}_branch_false`);
        falseBranch(sub);
        resolvedFalse = sub;
      } else {
        resolvedFalse = falseBranch;
      }
    }

    this.steps.push({
      type: 'branch',
      pred,
      trueChain: resolvedTrue,
      falseChain: resolvedFalse
    });

    // Reset counter across branches
    this.consecutiveFunctionCalls = 0;
    return this;
  }

  /**
   * Built-in Flow Control: Switching
   * Evaluates keyFn on the current payload and routes to matching branch.
   */
  switch(
    keyFn: (out: any) => string,
    cases: Record<string, string | ((chain: OrchestrationChain) => void)>,
    defaultCase?: string | ((chain: OrchestrationChain) => void)
  ): this {
    const resolvedCases: Record<string, OrchestrationChain | string> = {};
    for (const [key, handler] of Object.entries(cases)) {
      if (typeof handler === 'function') {
        const sub = new OrchestrationChain(this.entity, `${this.id}_case_${key}`);
        handler(sub);
        resolvedCases[key] = sub;
      } else {
        resolvedCases[key] = handler;
      }
    }

    let resolvedDefault: OrchestrationChain | string | undefined = undefined;
    if (defaultCase) {
      if (typeof defaultCase === 'function') {
        const sub = new OrchestrationChain(this.entity, `${this.id}_default`);
        defaultCase(sub);
        resolvedDefault = sub;
      } else {
        resolvedDefault = defaultCase;
      }
    }

    this.steps.push({
      type: 'switch',
      keyFn,
      cases: resolvedCases,
      defaultCase: resolvedDefault
    });

    this.consecutiveFunctionCalls = 0;
    return this;
  }

  /**
   * Built-in Flow Control: Merging
   * Joins multiple branch pathways or parallel results into current chain.
   */
  merge(...branchNames: string[]): this {
    this.steps.push({
      type: 'merge',
      mergeBranches: branchNames
    });
    this.consecutiveFunctionCalls = 0;
    return this;
  }

  /**
   * Built-in Flow Control: Parallel
   * Runs all targets concurrently with current input, returning array of results.
   */
  parallel(...targets: (string | ((arg: any) => any))[]): this {
    const parallelSteps = targets.map(t => {
      if (typeof t === 'string') {
        return { type: 'functionality' as const, target: t };
      }
      return { type: 'function' as const, target: t };
    });

    this.steps.push({
      type: 'parallel',
      parallelSteps
    });

    this.consecutiveFunctionCalls = 0;
    return this;
  }

  /**
   * Returns copy of all orchestration steps in this chain.
   */
  getSteps(): ReadonlyArray<KrnlFlowStep> {
    return [...this.steps];
  }

  /**
   * Register this orchestration chain as a local capability on the host entity.
   */
  register(opts?: {
    visibility?: 'public' | 'private' | string;
    description?: string;
    uiSpec?: KrnlUiSpec;
    intelligenceSpec?: any;
    manifest?: KrnlFunctionalityManifest;
  }): krnlLocalFunctionality {
    const steps = [...this.steps];
    const entity = this.entity;
    const chainId = this.id;

    return (entity as any).addLocal({
      id: chainId,
      visibility: opts?.visibility ?? 'public',
      description: opts?.description || `Orchestration [${chainId}] composing [${steps.map(s => s.fid || s.fnName || s.type).join(' → ')}]`,
      uiSpec: opts?.uiSpec,
      intelligenceSpec: opts?.intelligenceSpec,
      manifest: opts?.manifest,
      api: async (input: any) => OrchestrationChain._execute(entity, steps, input)
    });
  }

  /** Execute the chain directly */
  async run(input: any): Promise<any> {
    return OrchestrationChain._execute(this.entity, this.steps, input);
  }

  /**
   * Inbuilt step executor walking functionalities, global library functions, and flow constructs.
   */
  private static async _execute(entity: krnlEntityBase, steps: KrnlFlowStep[], input: any): Promise<any> {
    let current = input;

    for (const step of steps) {
      if (step.type === 'functionality') {
        current = await entity.call(step.fid!, current);
      } else if (step.type === 'entityOrchestration') {
        let target: krnlEntityBase | undefined;
        if (typeof step.targetEntity === 'string') {
          target = KrnlEntityRegistry.get(step.targetEntity);
          if (!target) {
            const owned = entity.hierarchyManager?.getAllOwnedComponentEntities?.() || [];
            target = owned.find((e: any) => e.entityName === step.targetEntity || e.id === step.targetEntity);
          }
          if (!target) {
            throw new Error(
              `[OrchestrationChain:${entity.id || entity.entityName}] Cannot resolve target entity '${step.targetEntity}'. Ensure the target entity is instantiated and registered in KrnlEntityRegistry.`
            );
          }
        } else {
          target = step.targetEntity;
        }
        current = await target!.call(step.targetOrchestration!, current);
      } else if (step.type === 'function') {
        if (typeof step.fn === 'function') {
          current = await step.fn(current);
        } else if (step.fnName) {
          // If referenced by name, attempt to find on global libraries attached to entity or global scope
          const libMethod = (entity as any)[step.fnName] || (globalThis as any)[step.fnName];
          if (typeof libMethod === 'function') {
            current = await libMethod(current);
          }
        }
      } else if (step.type === 'branch') {
        const matches = step.pred ? step.pred(current) : Boolean(current);
        const branchTarget = matches ? step.trueChain : step.falseChain;
        if (branchTarget instanceof OrchestrationChain) {
          current = await branchTarget.run(current);
        } else if (typeof branchTarget === 'string') {
          current = await entity.call(branchTarget, current);
        }
      } else if (step.type === 'switch') {
        const key = step.keyFn ? step.keyFn(current) : String(current);
        const branchTarget = (step.cases && step.cases[key]) ? step.cases[key] : step.defaultCase;
        if (branchTarget instanceof OrchestrationChain) {
          current = await branchTarget.run(current);
        } else if (typeof branchTarget === 'string') {
          current = await entity.call(branchTarget, current);
        }
      } else if (step.type === 'merge') {
        // In linear pipeline, merge passes current data through or flattens array if current is nested
        if (Array.isArray(current) && current.length > 0 && Array.isArray(current[0])) {
          current = current.flat();
        }
      } else if (step.type === 'parallel') {
        const pSteps = step.parallelSteps || [];
        current = await Promise.all(pSteps.map(ps => {
          if (ps.type === 'functionality' && typeof ps.target === 'string') {
            return entity.call(ps.target, current);
          } else if (typeof ps.target === 'function') {
            return ps.target(current);
          }
          return current;
        }));
      }
    }

    return current;
  }
}

/**
 * Backward compatibility alias: KrnlFlowBuilder is now powered by OrchestrationChain.
 */
export class KrnlFlowBuilder extends OrchestrationChain {}
