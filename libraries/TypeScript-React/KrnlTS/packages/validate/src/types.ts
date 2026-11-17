export interface ValidationError {
  ruleId: string;
  filePath: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface PromotableAsset {
  name: string;
  kind: string;
  filePath: string;
  scope: 'service' | 'component' | 'application';
  scopeName: string;
  target: 'GutTS';
}

export interface ValidationSummary {
  valid: boolean;
  totalFiles: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  promotableAssets?: PromotableAsset[];
}
