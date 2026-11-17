/**
 * @file CoreService.ts
 * @description CoreService base class inheriting from CoreEntity.
 * Conforms to Srkl-spec.md Section 4 & Section 6.
 * File size < 200 lines strictly.
 */

import { CoreEntity, CoreEntityData } from './CoreEntity';
import { ServiceDefinition, ServiceStatus } from '../types/srkl';

export interface CoreServiceData extends CoreEntityData {
  identifier: string;
  description: string;
  version: string;
  status: ServiceStatus;
  definition: ServiceDefinition;
}

export abstract class CoreService extends CoreEntity {
  public readonly identifier: string;
  public description: string;
  public version: string;
  public status: ServiceStatus;
  public readonly definition: ServiceDefinition;

  constructor(data: CoreServiceData) {
    super(data);
    this.identifier = data.identifier;
    this.description = data.description;
    this.version = data.version;
    this.status = data.status;
    this.definition = data.definition;
  }

  public setStatus(newStatus: ServiceStatus): void {
    this.status = newStatus;
    this.touch();
  }

  public override validate(): boolean {
    return Boolean(
      super.validate() &&
      this.identifier &&
      this.version &&
      this.definition &&
      this.definition.identifier === this.identifier
    );
  }

  public override toJSON(): CoreServiceData {
    return {
      ...super.toJSON(),
      identifier: this.identifier,
      description: this.description,
      version: this.version,
      status: this.status,
      definition: this.definition,
    };
  }
}
