// ══════════════════════════════════════════════════════════════════════════════════════════
// CANONICAL METRICS & USAGE WORKSPACE STORAGE (PURE FILE-BASED VAULT)
// ══════════════════════════════════════════════════════════════════════════════════════════

import { KeyModelUsageStats, KeyModelFailure } from '../types.js';
import { readVaultJsonSync, writeVaultJsonSync } from './workspaceFileSystem.js';

const USAGE_FILENAME = 'key_model_usage.json';
const FAILURES_FILENAME = 'key_model_failures.json';
const HEALTH_FILENAME = 'model_health_status.json';

interface ModelHealthEntry {
  status: string;
  consecutiveFailures: number;
  lastCheckedAt: string;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * UTILITY: MetricsStorageCoordinator
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Metrics Persistence Path:
 * ┌───────────────────────────────────────────────────────────┐
 * │ MetricsStorageCoordinator.recordKeyModelCall()            │
 * └─────────────────────────────┬─────────────────────────────┘
 *                               │
 *                               ▼
 * ┌───────────────────────────────────────────────────────────┐
 * │ writeVaultJsonSync: docustack_vault/key_model_usage.json  │
 * └─────────────────────────────┬─────────────────────────────┘
 *                               │
 *                               ▼
 * ┌───────────────────────────────────────────────────────────┐
 * │ WorkspaceFS: Asynchronous Multi-Cloud Storage Broadcast   │
 * └───────────────────────────────────────────────────────────┘
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class MetricsStorageCoordinator {
  private usageData: Record<string, Record<string, number>> = {};
  private failureData: Record<string, Record<string, KeyModelFailure>> = {};
  private healthData: Record<string, ModelHealthEntry> = {};
  private loaded = false;

  private ensureLoaded(): void {
    if (!this.loaded) {
      this.usageData = readVaultJsonSync(USAGE_FILENAME, {});
      this.failureData = readVaultJsonSync(FAILURES_FILENAME, {});
      this.healthData = readVaultJsonSync(HEALTH_FILENAME, {});
      this.loaded = true;
    }
  }

  public recordKeyModelCall(keyId: string, modelId: string, timestamp = new Date().toISOString()): void {
    this.ensureLoaded();
    const dateStr = timestamp.slice(0, 10);
    const compoundKey = `${keyId}::${modelId}`;
    if (!this.usageData[compoundKey]) {
      this.usageData[compoundKey] = {};
    }
    this.usageData[compoundKey][dateStr] = (this.usageData[compoundKey][dateStr] || 0) + 1;
    writeVaultJsonSync(USAGE_FILENAME, this.usageData);
  }

  public getKeyModelUsageStats(keyId: string, modelId: string): KeyModelUsageStats {
    this.ensureLoaded();
    const compoundKey = `${keyId}::${modelId}`;
    const dateMap = this.usageData[compoundKey] || {};
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let dailyCalls = 0;
    let weeklyCalls = 0;
    let monthlyCalls = 0;
    let allTimeCalls = 0;

    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    for (const [date, count] of Object.entries(dateMap)) {
      allTimeCalls += count;
      if (date === todayStr) dailyCalls += count;
      if (date >= sevenDaysAgo) weeklyCalls += count;
      if (date >= thirtyDaysAgo) monthlyCalls += count;
    }

    return {
      keyId,
      modelId,
      totalCalls: allTimeCalls,
      successfulCalls: allTimeCalls,
      failedCalls: 0,
      averageLatencyMs: 0,
      dailyCalls,
      weeklyCalls,
      monthlyCalls,
      allTimeCalls
    };
  }

  public getAllKeyModelUsageStats(): KeyModelUsageStats[] {
    this.ensureLoaded();
    const results: KeyModelUsageStats[] = [];
    for (const compoundKey of Object.keys(this.usageData)) {
      const parts = compoundKey.split('::');
      const keyId = parts[0] || '';
      const modelId = parts.slice(1).join('::') || '';
      if (keyId && modelId) {
        results.push(this.getKeyModelUsageStats(keyId, modelId));
      }
    }
    return results;
  }

  public recordKeyModelFailure(keyId: string, modelId: string, error?: string, timestamp = new Date().toISOString()): void {
    this.ensureLoaded();
    if (!this.failureData[keyId]) this.failureData[keyId] = {};
    const existing = this.failureData[keyId][modelId];
    const failureCount = (existing ? existing.failureCount : 0) + 1;
    const penaltyPercent = Math.min(95, 30 + (failureCount - 1) * 20);

    this.failureData[keyId][modelId] = {
      keyId,
      modelId,
      failureCount,
      penaltyPercent,
      lastFailedAt: timestamp,
      lastError: error || 'Inference error'
    };
    writeVaultJsonSync(FAILURES_FILENAME, this.failureData);
  }

  public recordKeyModelSuccess(keyId: string, modelId: string): void {
    this.ensureLoaded();
    if (this.failureData[keyId] && this.failureData[keyId][modelId]) {
      delete this.failureData[keyId][modelId];
      writeVaultJsonSync(FAILURES_FILENAME, this.failureData);
    }
  }

  public getKeyModelFailures(keyId: string): Record<string, KeyModelFailure> {
    this.ensureLoaded();
    return this.failureData[keyId] || {};
  }

  public resetKeyModelFailures(keyId: string): void {
    this.ensureLoaded();
    if (this.failureData[keyId]) {
      delete this.failureData[keyId];
      writeVaultJsonSync(FAILURES_FILENAME, this.failureData);
    }
  }

  public saveModelHealthStatus(modelId: string, status: string, consecutiveFailures: number, lastCheckedAt: string): void {
    this.ensureLoaded();
    this.healthData[modelId] = { status, consecutiveFailures, lastCheckedAt };
    writeVaultJsonSync(HEALTH_FILENAME, this.healthData);
  }

  public loadModelHealthStatuses(): Record<string, ModelHealthEntry> {
    this.ensureLoaded();
    return { ...this.healthData };
  }
}

export const metricsStorage = new MetricsStorageCoordinator();