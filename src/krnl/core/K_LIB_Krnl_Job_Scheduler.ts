/**
 * @file K_LIB_Krnl_Job_Scheduler.ts
 * @description Centralized Job Scheduler and Named Ticket Registry for KrnlTS applications.
 */

export interface KrnlJobTicket {
  id: string;
  fid: string;
  type: 'boot' | 'endpoint' | 'ui_trigger';
  status: 'pending' | 'running' | 'done' | 'error';
  startedAt: number;
  completedAt?: number;
  result?: any;
  error?: string;
  promise: Promise<KrnlJobTicket>;
  resolve: (ticket: KrnlJobTicket) => void;
  reject: (err: any) => void;
}

export class KrnlJobScheduler {
  private tickets: Map<string, KrnlJobTicket> = new Map();
  private ttlMs: number = 60000; // 60 seconds TTL for ticket cleanup

  constructor() {
    // Periodic TTL cleanup for stale tickets
    setInterval(() => this.cleanupExpiredTickets(), 30000);
  }

  /**
   * Create a new execution ticket
   */
  public createTicket(fid: string, type: 'boot' | 'endpoint' | 'ui_trigger'): KrnlJobTicket {
    const id = `job_${type}_${fid}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    let resolveFn!: (ticket: KrnlJobTicket) => void;
    let rejectFn!: (err: any) => void;

    const promise = new Promise<KrnlJobTicket>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    const ticket: KrnlJobTicket = {
      id,
      fid,
      type,
      status: 'pending',
      startedAt: Date.now(),
      promise,
      resolve: resolveFn,
      reject: rejectFn
    };

    this.tickets.set(id, ticket);
    return ticket;
  }

  public getTicket(id: string): KrnlJobTicket | null {
    return this.tickets.get(id) || null;
  }

  public markRunning(id: string): void {
    const ticket = this.tickets.get(id);
    if (ticket && ticket.status === 'pending') {
      ticket.status = 'running';
    }
  }

  public markDone(id: string, result?: any): void {
    const ticket = this.tickets.get(id);
    if (ticket && (ticket.status === 'pending' || ticket.status === 'running')) {
      ticket.status = 'done';
      ticket.completedAt = Date.now();
      ticket.result = result;
      ticket.resolve(ticket);
    }
  }

  public markError(id: string, error: string): void {
    const ticket = this.tickets.get(id);
    if (ticket && (ticket.status === 'pending' || ticket.status === 'running')) {
      ticket.status = 'error';
      ticket.completedAt = Date.now();
      ticket.error = error;
      ticket.resolve(ticket); // Resolve promise with error ticket status
    }
  }

  public async waitForTicket(id: string, timeoutMs: number = 10000): Promise<KrnlJobTicket> {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      throw new Error(`[KrnlJobScheduler] Ticket '${id}' not found.`);
    }

    if (ticket.status === 'done' || ticket.status === 'error') {
      return ticket;
    }

    let timeoutHandle: any;
    const timeoutPromise = new Promise<KrnlJobTicket>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        this.markError(id, `Timeout waiting for job ticket '${id}' after ${timeoutMs}ms`);
        reject(new Error(`[KrnlJobScheduler] Timeout waiting for job ticket '${id}' after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const res = await Promise.race([ticket.promise, timeoutPromise]);
      clearTimeout(timeoutHandle);
      return res;
    } catch (err) {
      clearTimeout(timeoutHandle);
      throw err;
    }
  }

  private cleanupExpiredTickets(): void {
    const now = Date.now();
    for (const [id, ticket] of this.tickets.entries()) {
      if (now - ticket.startedAt > this.ttlMs) {
        this.tickets.delete(id);
      }
    }
  }
}
