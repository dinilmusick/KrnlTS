// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { KrnlFS } from "../../tools/KrnlFS.js";
import type { AuditLogEntry, UserRole } from "../types.js";
import path from "path";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. AUDIT LOGGER ENGINE (IMMUTABLE AUDIT TRAILS)
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: AuditLogger
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Records immutable audit trails for all administrative mutations, user status changes,
 *          backend connection switches, and cluster failover events.
 *
 * Flow Chart:
 *   [Admin Mutation / State Change] ───► [Construct AuditLogEntry]
 *                                                    │
 *                                                    ▼
 *                                          [Append to Audit Vault] ───► [.krnl/audit_trail.jsonl]
 *
 * Example Usage:
 *   const auditLogger = new AuditLogger("./.krnl/control_plane/audit_trail.jsonl");
 *   await auditLogger.log({
 *     actorUserId: "admin_01",
 *     actorRole: "ADMIN",
 *     action: "PROMOTE_DATABASE_PRIMARY",
 *     resource: "cluster_db_turso",
 *     status: "SUCCESS"
 *   });
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class AuditLogger {
  private filePath: string;

  constructor(filePath = "./.krnl/control_plane/audit_trail.jsonl") {
    this.filePath = filePath;
  }

  /**
   * Records an immutable audit log entry.
   */
  public async log(params: {
    actorUserId: string;
    actorRole: UserRole;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    status?: "SUCCESS" | "FAILURE" | "SECURITY_DENIED";
  }): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: params.action,
      resource: params.resource,
      details: params.details || {},
      ipAddress: params.ipAddress,
      status: params.status || "SUCCESS"
    };

    const line = JSON.stringify(entry) + "\n";
    try {
      await KrnlFS.ensureDir(path.dirname(this.filePath));
      await KrnlFS.appendFile(this.filePath, line);
    } catch {
      // Non-blocking fallback
    }

    return entry;
  }

  /**
   * Retrieves historical audit entries with optional filtering.
   */
  public async query(filter?: {
    actorUserId?: string;
    action?: string;
    status?: string;
    actorRole?: UserRole;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    if (!(await KrnlFS.fileExists(this.filePath))) {
      return [];
    }

    try {
      const raw = await KrnlFS.readFile(this.filePath);
      const lines = raw.split("\n").filter(l => l.trim().length > 0);
      let entries: AuditLogEntry[] = lines
        .map(l => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter((e): e is AuditLogEntry => e !== null);

      if (filter?.actorUserId) {
        entries = entries.filter(e => e.actorUserId === filter.actorUserId);
      }
      if (filter?.action) {
        entries = entries.filter(e => e.action === filter.action);
      }
      if (filter?.status) {
        entries = entries.filter(e => e.status === filter.status);
      }
      if (filter?.actorRole) {
        entries = entries.filter(e => String(e.actorRole).toUpperCase() === String(filter.actorRole).toUpperCase());
      }

      // Sort descending by timestamp
      entries.sort((a, b) => b.timestamp - a.timestamp);

      if (filter?.limit && filter.limit > 0) {
        entries = entries.slice(0, filter.limit);
      }

      return entries;
    } catch {
      return [];
    }
  }
}
