/**
 * @file ServiceAction.ts
 * @description ServiceAction concrete model inheriting from CoreAction.
 * Conforms to Srkl-spec.md Section 11.
 * File size < 200 lines strictly.
 */

import { CoreAction, CoreActionData } from './CoreAction';

export interface ServiceActionData extends CoreActionData {
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  permissions?: string[];
}

export class ServiceAction extends CoreAction {
  public inputSchema?: Record<string, unknown>;
  public outputSchema?: Record<string, unknown>;
  public permissions: string[];

  constructor(data: ServiceActionData) {
    super(data);
    this.inputSchema = data.inputSchema;
    this.outputSchema = data.outputSchema;
    this.permissions = data.permissions ? [...data.permissions] : ['USER'];
  }

  public override toJSON(): ServiceActionData {
    return {
      ...super.toJSON(),
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      permissions: [...this.permissions],
    };
  }
}
