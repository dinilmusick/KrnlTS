/**
 * @file CoreResource.ts
 * @description CoreResource base entity inheriting from CoreEntity.
 * Adheres to Srkl-spec.md Section 4 & Section 10.
 * File size < 200 lines strictly.
 */

import { CoreEntity, CoreEntityData } from './CoreEntity';

export interface CoreResourceData extends CoreEntityData {
  serviceId: string;
  accountId: string;
  resourceType: string;
  parentId?: string | null;
  status: string;
}

export type CreateCoreResourceInput = Omit<CoreResourceData, 'entityType'> & {
  entityType?: CoreEntityData['entityType'];
};

export abstract class CoreResource extends CoreEntity {
  public readonly serviceId: string;
  public readonly accountId: string;
  public readonly resourceType: string;
  public parentId?: string | null;
  public status: string;

  constructor(data: CreateCoreResourceInput) {
    super({
      ...data,
      entityType: data.entityType ?? 'SERVICE_RESOURCE',
    });
    this.serviceId = data.serviceId;
    this.accountId = data.accountId;
    this.resourceType = data.resourceType;
    this.parentId = data.parentId ?? null;
    this.status = data.status;
  }

  public override validate(): boolean {
    return Boolean(
      super.validate() &&
      this.serviceId &&
      this.accountId &&
      this.resourceType
    );
  }

  public override toJSON(): CoreResourceData {
    return {
      ...super.toJSON(),
      serviceId: this.serviceId,
      accountId: this.accountId,
      resourceType: this.resourceType,
      parentId: this.parentId,
      status: this.status,
    };
  }
}
