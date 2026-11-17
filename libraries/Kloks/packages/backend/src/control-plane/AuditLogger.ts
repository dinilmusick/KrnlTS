import { promises as fs } from 'fs';
import path from 'path';
import { SkipoBase } from '@kloks/functions/base';
import { AuditEvent } from './types.js';

export class AuditLogger extends SkipoBase {
  private logFile: string;

  constructor(logFile = '.skipo/audit.jsonl') {
    super();
    this.logFile = path.resolve(logFile);
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };
    
    await fs.mkdir(path.dirname(this.logFile), { recursive: true });
    await fs.appendFile(this.logFile, JSON.stringify(fullEvent) + '\n');
  }

  async query(filter: (e: AuditEvent) => boolean): Promise<AuditEvent[]> {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      const events = lines.map(l => JSON.parse(l) as AuditEvent);
      return events.filter(filter);
    } catch (e: any) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  }

  async tail(n: number): Promise<AuditEvent[]> {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      return lines.slice(-n).map(l => JSON.parse(l));
    } catch (e: any) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  }
}
