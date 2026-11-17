/**
 * @file ServiceResource.ts
 * @description ServiceResource concrete entity inheriting from CoreResource.
 * Adheres to Srkl-spec.md Section 10.
 * File size < 200 lines strictly.
 */

import { CoreResource, CoreResourceData } from './CoreResource';

export interface ServiceResourceData extends CoreResourceData {
  sizeBytes?: number;
  objectCount?: number;
  supportedActions: string[];
  attributes?: Record<string, unknown>;
}

export type CreateServiceResourceInput = Omit<ServiceResourceData, 'entityType'> & {
  entityType?: CoreResourceData['entityType'];
};

export class ServiceResource extends CoreResource {
  public sizeBytes: number;
  public objectCount: number;
  public supportedActions: string[];
  public attributes: Record<string, unknown>;

  constructor(data: CreateServiceResourceInput) {
    super(data);
    this.sizeBytes = data.sizeBytes ?? 0;
    this.objectCount = data.objectCount ?? 0;
    this.supportedActions = data.supportedActions ? [...data.supportedActions] : [];
    this.attributes = data.attributes ? { ...data.attributes } : {};
  }

  public supportsAction(actionId: string): boolean {
    return this.supportedActions.includes(actionId);
  }

  public override toJSON(): ServiceResourceData {
    return {
      ...super.toJSON(),
      sizeBytes: this.sizeBytes,
      objectCount: this.objectCount,
      supportedActions: [...this.supportedActions],
      attributes: { ...this.attributes },
    };
  }
}
