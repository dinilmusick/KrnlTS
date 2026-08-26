export function createLog(action: string): string {
  return `[AUDIT_LOG @ ${new Date().toISOString()}] ${action}`;
}
