import { AbuseAnomalyType } from './types';

export const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
export const AUTH_FAIL_SPIKE_THRESHOLD = 25; // 25 failed auths in 5m
export const AUTH_FAIL_SPIKE_WINDOW_MS = 5 * 60 * 1000;

interface BlockRecord {
  ip: string;
  blockedAt: number;
  expiresAt: number;
  trigger: AbuseAnomalyType;
  reason: string;
}

const blockedIps = new Map<string, BlockRecord>();
const authFailuresByIp = new Map<string, number[]>();
const requestTimestampsByIp = new Map<string, number[]>();

export function isIpBlocked(ip: string): { blocked: boolean; retryAfterSeconds?: number; reason?: string } {
  if (!ip) return { blocked: false };
  const cleanIp = ip.trim().replace(/^::ffff:/, '');
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
    return { blocked: false };
  }

  const record = blockedIps.get(cleanIp);
  if (!record) return { blocked: false };

  const now = Date.now();
  if (now >= record.expiresAt) {
    blockedIps.delete(cleanIp);
    return { blocked: false };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((record.expiresAt - now) / 1000));
  return { blocked: true, retryAfterSeconds, reason: record.reason };
}

export function blockIp(
  ip: string,
  trigger: AbuseAnomalyType = 'REQUEST_RATE_SPIKE',
  reason = 'Automated abuse threshold triggered',
  durationMs = BLOCK_DURATION_MS
): void {
  const cleanIp = ip.trim().replace(/^::ffff:/, '');
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') return;

  const now = Date.now();
  blockedIps.set(cleanIp, {
    ip: cleanIp,
    blockedAt: now,
    expiresAt: now + durationMs,
    trigger,
    reason,
  });
  console.warn(`[ABUSE DETECTOR] Blocked IP ${cleanIp} for ${durationMs / 1000}s. Trigger: ${trigger} - ${reason}`);
}

export function unblockIp(ip: string): boolean {
  const cleanIp = ip.trim().replace(/^::ffff:/, '');
  return blockedIps.delete(cleanIp);
}

export function recordAuthFailure(ip: string): void {
  const cleanIp = ip.trim().replace(/^::ffff:/, '');
  if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1') return;

  const now = Date.now();
  const history = (authFailuresByIp.get(cleanIp) || []).filter((ts) => now - ts < AUTH_FAIL_SPIKE_WINDOW_MS);
  history.push(now);
  authFailuresByIp.set(cleanIp, history);

  if (history.length >= AUTH_FAIL_SPIKE_THRESHOLD) {
    blockIp(
      cleanIp,
      '401_SPIKE',
      `Excessive failed authentication attempts (${history.length} in 5m)`
    );
  }
}

export function recordRequestRateAnomaly(ip: string, maxPerSecond = 60): boolean {
  const cleanIp = ip.trim().replace(/^::ffff:/, '');
  if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1') return false;

  const now = Date.now();
  const windowMs = 1000;
  const history = (requestTimestampsByIp.get(cleanIp) || []).filter((ts) => now - ts < windowMs);
  history.push(now);
  requestTimestampsByIp.set(cleanIp, history);

  if (history.length > maxPerSecond) {
    blockIp(
      cleanIp,
      'REQUEST_RATE_SPIKE',
      `Request flood anomaly detected: ${history.length} req/s exceeds limit ${maxPerSecond}`,
      BLOCK_DURATION_MS
    );
    return true;
  }
  return false;
}
