export interface AuditInput {
  action: string;
}
export interface AuditOutput {
  logged: boolean;
  entry: string;
}
