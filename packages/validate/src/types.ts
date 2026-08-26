export interface ValidationError {
  ruleId: string;
  filePath: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  valid: boolean;
  totalFiles: number;
  errors: ValidationError[];
  warnings: ValidationError[];
}
