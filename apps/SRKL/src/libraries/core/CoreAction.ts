/**
 * @file CoreAction.ts
 * @description CoreAction base entity inheriting from CoreEntity.
 * Adheres to Srkl-spec.md Section 4 & Section 11.
 * File size < 200 lines strictly.
 */

import { CoreEntity, CoreEntityData } from './CoreEntity';
import { ActionType } from '../types/srkl';

export interface CoreActionData extends CoreEntityData {
  serviceId: string;
  actionType: ActionType;
  description: string;
  destructive?: boolean;
}

export abstract class CoreAction extends CoreEntity {
  public readonly serviceId: string;
  public readonly actionType: ActionType;
  public description: string;
  public destructive: boolean;

  constructor(data: CoreActionData) {
    super(data);
    this.serviceId = data.serviceId;
    this.actionType = data.actionType;
    this.description = data.description;
    this.destructive = data.destructive ?? false;
  }

  public override validate(): boolean {
    return Boolean(
      super.validate() &&
      this.serviceId &&
      this.actionType
    );
  }

  public override toJSON(): CoreActionData {
    return {
      ...super.toJSON(),
      serviceId: this.serviceId,
      actionType: this.actionType,
      description: this.description,
      destructive: this.destructive,
    };
  }
}
