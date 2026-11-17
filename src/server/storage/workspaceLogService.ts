/**
 * @file workspaceLogService.ts
 * @description Workspace Per-Service Log Manager.
 * Arranges logs neatly into service-specific folders within the workspace:
 * logs/{serviceId}/activity.jsonl and logs/{serviceId}/{YYYY-MM-DD}.log
 * File size strictly < 200 lines.
 */

import fs from 'fs';
import path from 'path';
import { UserStorageConnection } from '@/libraries/types/auth';
import { readCloudWorkspaceFile, writeCloudWorkspaceFile } from './cloudStorageService';

export interface ServiceLogEvent {
  ts?: string;
  serviceId: string;
  action: string;
  status: 'ok' | 'error' | 'pending';
  accountId?: string;
  latencyMs?: number;
  details?: string;
  error?: string;
}

export function sanitizeServiceId(serviceId: string): string {
  return (serviceId || 'general').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

export async function appendServiceLog(
  conn: UserStorageConnection | null,
  folderPrefix: string,
  event: ServiceLogEvent
): Promise<void> {
  const ts = event.ts || new Date().toISOString();
  const dateStr = ts.slice(0, 10);
  const cleanId = sanitizeServiceId(event.serviceId);
  const jsonLine = JSON.stringify({ ts, ...event }) + '\n';
  const textLine = `[${ts}] [${event.action.toUpperCase()}] [${event.status.toUpperCase()}] ${event.details || ''} ${event.error ? `Error: ${event.error}` : ''}\n`;

  const jsonlRelPath = `logs/${cleanId}/activity.jsonl`;
  const textLogRelPath = `logs/${cleanId}/${dateStr}.log`;

  if (!conn || conn.provider === 'local_fs') {
    try {
      const localBase = path.resolve(process.cwd(), folderPrefix, 'logs', cleanId);
      if (!fs.existsSync(localBase)) fs.mkdirSync(localBase, { recursive: true });
      fs.appendFileSync(path.join(localBase, 'activity.jsonl'), jsonLine, 'utf-8');
      fs.appendFileSync(path.join(localBase, `${dateStr}.log`), textLine, 'utf-8');
    } catch (err: any) {
      console.warn(`[WorkspaceLog] Failed to append local log for ${cleanId}:`, err.message);
    }
    return;
  }

  // Cloud Storage Append (B2 / S3)
  try {
    const existingJsonl = await readCloudWorkspaceFile(conn, folderPrefix, jsonlRelPath).catch(() => null);
    const updatedJsonl = existingJsonl ? Buffer.concat([existingJsonl, Buffer.from(jsonLine, 'utf-8')]) : Buffer.from(jsonLine, 'utf-8');
    await writeCloudWorkspaceFile(conn, folderPrefix, jsonlRelPath, updatedJsonl, 'application/x-ndjson');

    const existingText = await readCloudWorkspaceFile(conn, folderPrefix, textLogRelPath).catch(() => null);
    const updatedText = existingText ? Buffer.concat([existingText, Buffer.from(textLine, 'utf-8')]) : Buffer.from(textLine, 'utf-8');
    await writeCloudWorkspaceFile(conn, folderPrefix, textLogRelPath, updatedText, 'text/plain');
  } catch (err: any) {
    console.warn(`[WorkspaceLog] Failed to append cloud log for ${cleanId}:`, err.message);
  }
}

export async function getServiceLogs(
  conn: UserStorageConnection | null,
  folderPrefix: string,
  serviceId: string,
  limit: number = 100
): Promise<ServiceLogEvent[]> {
  const cleanId = sanitizeServiceId(serviceId);
  const jsonlRelPath = `logs/${cleanId}/activity.jsonl`;

  if (!conn || conn.provider === 'local_fs') {
    const localFile = path.resolve(process.cwd(), folderPrefix, jsonlRelPath);
    if (!fs.existsSync(localFile)) return [];
    try {
      const content = fs.readFileSync(localFile, 'utf-8');
      return parseJsonlLogs(content, limit);
    } catch {
      return [];
    }
  }

  try {
    const buf = await readCloudWorkspaceFile(conn, folderPrefix, jsonlRelPath);
    if (!buf) return [];
    return parseJsonlLogs(buf.toString('utf-8'), limit);
  } catch {
    return [];
  }
}

function parseJsonlLogs(raw: string, limit: number): ServiceLogEvent[] {
  return raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean)
    .reverse()
    .slice(0, limit);
}
