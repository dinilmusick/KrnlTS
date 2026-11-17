/**
 * @file CoreAccount.ts
 * @description CoreAccount base entity inheriting from CoreEntity.
 * Adheres to Srkl-spec.md Section 4 & Section 9.
 * File size < 200 lines strictly.
 */

import { CoreEntity, CoreEntityData } from './CoreEntity';
import { ServiceStatus } from '../types/srkl';

export interface CoreAccountData extends CoreEntityData {
  serviceId: string;
  status: ServiceStatus;
  lastSync: string;
  groupId?: string;
  groupIds?: string[];
}

export abstract class CoreAccount extends CoreEntity {
  public readonly serviceId: string;
  public status: ServiceStatus;
  public lastSync: string;
  public groupId?: string;
  public groupIds: string[];

  constructor(data: CoreAccountData) {
    super(data);
    this.serviceId = data.serviceId;
    this.status = data.status;
    this.lastSync = data.lastSync;
    this.groupIds = data.groupIds && Array.isArray(data.groupIds) && data.groupIds.length > 0
      ? data.groupIds
      : (data.groupId ? [data.groupId] : []);
    this.groupId = this.groupIds[0] || data.groupId;
  }

  public updateSyncTimestamp(): void {
    this.lastSync = new Date().toISOString();
    this.touch();
  }

  public override validate(): boolean {
    return Boolean(super.validate() && this.serviceId);
  }

  public override toJSON(): CoreAccountData {
    return {
      ...super.toJSON(),
      serviceId: this.serviceId,
      status: this.status,
      lastSync: this.lastSync,
      groupId: this.groupIds[0] || this.groupId,
      groupIds: this.groupIds,
    };
  }
}
