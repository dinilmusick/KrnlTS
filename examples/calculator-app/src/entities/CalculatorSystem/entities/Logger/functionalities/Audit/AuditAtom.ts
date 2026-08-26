export interface AuditInput {
  action: string;
  metadata?: any;
}

export interface AuditOutput {
  logged: boolean;
  entry: string;
}
