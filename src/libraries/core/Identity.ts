/**
 * @file Identity.ts
 * @description Implementation of SRKL (Service Hub) Section 1: Identity.
 * Inherits from CoreEntity as required by Section 4 (Inheritance).
 * Adheres to Skipo code limits (<200 lines).
 */

import { CoreEntity, CoreEntityData } from './CoreEntity';

export interface SystemIdentityData extends CoreEntityData {
  pronunciation: string;
  expansion: string;
  purpose: string;
  primaryTarget: string;
  primaryRuntime: string;
  developmentEnvironment: string;
  version: string;
}

export const SRKL_IDENTITY_SPEC: Readonly<Omit<SystemIdentityData, 'id' | 'createdAt' | 'updatedAt'>> = {
  name: 'SRKL',
  pronunciation: 'Circle',
  expansion: 'Service Hub',
  purpose: 'SURVEILLANCE + ACCESS + CONTROL OF SERVICES',
  primaryTarget: 'LOCAL-FIRST SERVICE HUB',
  primaryRuntime: 'React + TypeScript',
  developmentEnvironment: 'Google AI Studio',
  version: '1.0.0',
  entityType: 'SYSTEM_IDENTITY',
};

export class SystemIdentityEntity extends CoreEntity {
  public readonly pronunciation: string;
  public readonly expansion: string;
  public readonly purpose: string;
  public readonly primaryTarget: string;
  public readonly primaryRuntime: string;
  public readonly developmentEnvironment: string;
  public readonly version: string;

  constructor(customData?: Partial<SystemIdentityData>) {
    const now = new Date().toISOString();
    super({
      id: customData?.id ?? 'srkl-system-root-identity',
      name: customData?.name ?? SRKL_IDENTITY_SPEC.name,
      entityType: SRKL_IDENTITY_SPEC.entityType,
      createdAt: customData?.createdAt ?? now,
      updatedAt: customData?.updatedAt ?? now,
      metadata: customData?.metadata ?? {},
    });

    this.pronunciation = customData?.pronunciation ?? SRKL_IDENTITY_SPEC.pronunciation;
    this.expansion = customData?.expansion ?? SRKL_IDENTITY_SPEC.expansion;
    this.purpose = customData?.purpose ?? SRKL_IDENTITY_SPEC.purpose;
    this.primaryTarget = customData?.primaryTarget ?? SRKL_IDENTITY_SPEC.primaryTarget;
    this.primaryRuntime = customData?.primaryRuntime ?? SRKL_IDENTITY_SPEC.primaryRuntime;
    this.developmentEnvironment =
      customData?.developmentEnvironment ?? SRKL_IDENTITY_SPEC.developmentEnvironment;
    this.version = customData?.version ?? SRKL_IDENTITY_SPEC.version;
  }

  public getFormalDescriptor(): string {
    return `${this.name} (${this.pronunciation}) — ${this.expansion}: ${this.purpose}`;
  }

  public override validate(): boolean {
    const isBaseValid = super.validate();
    return (
      isBaseValid &&
      this.name === 'SRKL' &&
      this.expansion === 'Service Hub' &&
      Boolean(this.purpose && this.primaryTarget)
    );
  }

  public override toJSON(): SystemIdentityData {
    return {
      ...super.toJSON(),
      pronunciation: this.pronunciation,
      expansion: this.expansion,
      purpose: this.purpose,
      primaryTarget: this.primaryTarget,
      primaryRuntime: this.primaryRuntime,
      developmentEnvironment: this.developmentEnvironment,
      version: this.version,
    };
  }
}
