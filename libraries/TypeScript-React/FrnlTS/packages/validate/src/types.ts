export type FrnlValidationSeverity = 'error' | 'warning';

export interface FrnlValidationDiagnostic {
  ruleId: string;
  filePath: string;
  line?: number;
  message: string;
  severity: FrnlValidationSeverity;
}

export interface FrnlPromotableAsset {
  name: string;
  kind: string;
  filePath: string;
  scope: 'component';
  scopeName: string;
  target: 'GutTS';
}

export interface FrnlValidationResult {
  errors: FrnlValidationDiagnostic[];
  warnings: FrnlValidationDiagnostic[];
  filesChecked: number;
  passed: boolean;
  promotableAssets?: FrnlPromotableAsset[];
}
