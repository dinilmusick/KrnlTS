/**
 * @file K_LIB_Krnl_Flow.ts
 * @description In-Entity Flow Orchestration.
 *
 * A Flow IS a Functionality at the interface level:
 * - It has the same signature: input → execution → output + events + UI + state
 * - It is registered on an Entity via `entity.addLocal(...)`
 * - It bubbles, is exposed via protocol adapters, and participates in telemetry
 * - It composes existing functionalities within an entity boundary
 */

import type { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
import type { krnlLocalFunctionality, KrnlFunctionalityManifest } from "./K_LIB_Krnl_Functionality_Types.js";
import type { KrnlUiSpec } from "./types.js";

export interface KrnlFlowStep {
  type: 'seq' | 'branch' | 'parallel';
  fid?: string;
  fids?: string[];
  pred?: (out: any) => boolean;
  trueFid?: string;
  falseFid?: string;
}

export class KrnlFlowBuilder {
  private entity: krnlEntityBase;
  private id: string;
  private steps: KrnlFlowStep[] = [];

  constructor(entity: krnlEntityBase, id: string) {
    this.entity = entity;
    this.id = id;
  }

  /** Sequential: output of previous step is passed as input to fid */
  then(fid: string): this {
    this.steps.push({ type: 'seq', fid });
    return this;
  }

  /** Branch: predicate on current output routes to trueFid or falseFid */
  branch(pred: (out: any) => boolean, trueFid: string, falseFid?: string): this {
    this.steps.push({ type: 'branch', pred, trueFid, falseFid });
    return this;
  }

  /** Parallel: run all fids concurrently with current input, collect results as array */
  parallel(...fids: string[]): this {
    this.steps.push({ type: 'parallel', fids });
    return this;
  }

  /**
   * Register this flow as a krnlLocalFunctionality on the host entity.
   * The Flow becomes a first-class capability on the entity.
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
    const flowId = this.id;

    return (entity as any).addLocal({
      id: flowId,
      visibility: opts?.visibility ?? 'public',
      description: opts?.description || `Flow [${flowId}] composing [${steps.map(s => s.fid || (s.fids ? s.fids.join(',') : 'branch')).join(' → ')}]`,
      uiSpec: opts?.uiSpec,
      intelligenceSpec: opts?.intelligenceSpec,
      manifest: opts?.manifest,
      api: async (input: any) => KrnlFlowBuilder._execute(entity, steps, input)
    });
  }

  /** Execute the flow directly without registering as a functionality */
  async run(input: any): Promise<any> {
    return KrnlFlowBuilder._execute(this.entity, this.steps, input);
  }

  /**
   * Internal step executor walking the entity's functionalities via `entity.call(fid, input)`.
   */
  private static async _execute(entity: krnlEntityBase, steps: KrnlFlowStep[], input: any): Promise<any> {
    let current = input;
    for (const step of steps) {
      if (step.type === 'seq') {
        current = await entity.call(step.fid!, current);
      } else if (step.type === 'branch') {
        const matches = step.pred ? step.pred(current) : Boolean(current);
        const targetFid = matches ? step.trueFid : step.falseFid;
        if (targetFid) {
          current = await entity.call(targetFid, current);
        }
      } else if (step.type === 'parallel') {
        const fids = step.fids || [];
        current = await Promise.all(fids.map(fid => entity.call(fid, current)));
      }
    }
    return current;
  }
}
