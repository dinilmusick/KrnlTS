import fs from 'fs';
import path from 'path';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor_user_id: string;
  ip_address?: string;
  details?: string;
  target_type?: string;
}

let inMemoryLogs: AuditLog[] = [];

function getAuditLogsFilePath(): string {
  try {
    const baseDir = path.resolve(process.cwd(), 'control_plane');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return path.join(baseDir, 'audit_logs.json');
  } catch {
    return path.join('/tmp', 'srkl_audit_logs.json');
  }
}

export async function addAuditLog(
  action: string,
  actorId: string,
  details: string,
  targetType?: string,
  ip?: string
): Promise<void> {
  const logItem: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    actor_user_id: actorId,
    ip_address: ip || '127.0.0.1',
    details,
    target_type: targetType || 'system',
  };

  inMemoryLogs.unshift(logItem);
  if (inMemoryLogs.length > 500) {
    inMemoryLogs.pop();
  }

  try {
    const filePath = getAuditLogsFilePath();
    let fileLogs: AuditLog[] = [];
    if (fs.existsSync(filePath)) {
      try {
        fileLogs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {
        fileLogs = [];
      }
    }
    fileLogs.unshift(logItem);
    if (fileLogs.length > 500) {
      fileLogs = fileLogs.slice(0, 500);
    }
    fs.writeFileSync(filePath, JSON.stringify(fileLogs, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem gracefully handles in-memory fallback
  }
}

export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  try {
    const filePath = getAuditLogsFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed.slice(0, limit);
    }
  } catch {}

  return inMemoryLogs.slice(0, limit);
}

