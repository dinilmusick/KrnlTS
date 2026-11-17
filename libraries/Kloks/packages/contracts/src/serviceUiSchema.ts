/**
 * @file serviceUiSchema.ts
 * @description Formal typed and versioned Service UI Schema contracts for the SKIPO ecosystem.
 * Defines canonical composition from Service -> UI -> Page -> Section -> Component -> AssetRef.
 */

export type UIRequirementMode = 'required' | 'optional' | 'none';

export interface AssetRef {
  packageId: string;      // e.g. '@ultrst-armada/floks'
  packageVersion: string; // semver range, e.g. '^1.2.3'
  exportPath: string;     // e.g. 'ui'
  assetId: string;        // e.g. 'AuthPage'
  assetVersion: string;   // contract version, e.g. '1.0.0'
}

export interface OperationBinding {
  operationId: string;    // e.g. 'AuthClientService.login'
  uiPath: string;         // e.g. 'Auth.ui.LoginSection'
}

export interface ComponentDescriptor {
  name: string;
  assetRef: AssetRef;
  description?: string;
}

export interface SectionDescriptor {
  name: string;
  /** Optional for structural authoring sections that are not reusable components. */
  assetRef?: AssetRef;
  components: ComponentDescriptor[];
  description?: string;
}

export interface PageDescriptor {
  name: string;
  sections: SectionDescriptor[];
  description?: string;
}

export interface ServiceUISchema {
  schemaId: string;
  schemaVersion: string;
  serviceId: string;
  requirementMode: UIRequirementMode;
  pages: PageDescriptor[];
  sections: SectionDescriptor[];
  components: ComponentDescriptor[];
  assetRefs: AssetRef[];
  operationBindings: OperationBinding[];
}
