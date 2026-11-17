/**
 * ASCII Architecture Flowchart: modelHealthService
 *
 *   ┌──────────────────────────────────┐
 *   │  Initialize modelHealthService   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            intervalMs            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               keys               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               key                │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { keyStore } from '../keyStore.js';
import { modelCatalog } from '../modelCatalog.js';
import { dbStore } from '../dbStore.js';
import { performInference } from '../inferenceExecutor.js';
import { ModelCheckResult } from '../types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export class ModelHealthService {
  private static instance: ModelHealthService;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  private constructor() {
    this.startRoutineChecks();
  }

  public static getInstance(): ModelHealthService {
    if (!ModelHealthService.instance) {
      ModelHealthService.instance = new ModelHealthService();
    }
    return ModelHealthService.instance;
  }

  public startRoutineChecks() {
    if (this.checkInterval) return;

    const intervalMs = 15 * 60 * 1000;
    this.checkInterval = setInterval(() => {
      this.runAutomatedChecks().catch(err => {
        console.error('[ModelHealthService] Automated check error:', err);
      });
    }, intervalMs);
    this.checkInterval.unref?.();

    const initialTimeout = setTimeout(() => {
      this.runAutomatedChecks().catch(err => {
        console.error('[ModelHealthService] Initial automated check error:', err);
      });
    }, 10000);
    initialTimeout.unref?.();
  }

  public stopRoutineChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public async runAutomatedChecks(): Promise<void> {
    if (this.isChecking) {
      console.log('[ModelHealthService] Check already in progress, skipping routine run.');
      return;
    }

    this.isChecking = true;
    console.log('[ModelHealthService] Starting routine automated health checks...');

    try {
      const keys = keyStore.getKeys().filter(k => k.status === 'active' || k.status === 'checking');
      for (const key of keys) {
        console.log(`[ModelHealthService] Checking models for key: ${key.label} (${key.id})`);
        await this.checkKeyModels(key.id);
      }
      console.log('[ModelHealthService] Routine automated health checks completed successfully.');
    } catch (err) {
      console.error('[ModelHealthService] Error during automated health checks:', err);
    } finally {
      this.isChecking = false;
    }
  }

  public async checkKeyModels(keyId: string): Promise<ModelCheckResult[]> {
    const key = keyStore.getKeys().find(k => k.id === keyId);
    if (!key) {
      throw new Error(`API key ${keyId} not found in keyStore`);
    }

    const providerId = key.providerId;
    const rawModels = modelCatalog.getCatalog(providerId);
    const seenModelIds = new Set<string>();
    const models = rawModels.filter(m => {
      if (seenModelIds.has(m.id)) return false;
      seenModelIds.add(m.id);
      return true;
    });
    const results: ModelCheckResult[] = [];

    const persistedStatuses = dbStore.loadModelHealthStatuses();

    for (const model of models) {
      if (model.id.includes('llama-3.2-3b')) {
        continue;
      }

      const start = Date.now();
      let status: 'working' | 'failed' = 'working';
      let errorMsg: string | undefined = undefined;

      try {
        const testPromise = performInference(providerId, model.id, key.key, "Ping test. Please reply with 'pong'.");
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Inference check timed out after 8s')), 8000)
        );

        await Promise.race([testPromise, timeoutPromise]);
        dbStore.recordKeyModelSuccess(keyId, model.id);
      } catch (err: any) {
        status = 'failed';
        errorMsg = err.message || String(err);
        dbStore.recordKeyModelFailure(keyId, model.id, errorMsg);
      }

      const latencyMs = Date.now() - start;
      results.push({
        modelId: model.id,
        name: model.name,
        status,
        error: errorMsg,
        latencyMs
      });

      const currentPersisted = persistedStatuses[model.id] || { consecutiveFailures: 0, status: 'online' };
      let consecutiveFailures = currentPersisted.consecutiveFailures;

      if (status === 'failed') {
        consecutiveFailures += 1;
      } else {
        consecutiveFailures = 0;
      }

      let newStatus: 'online' | 'currently_unavailable' | 'offline' = 'online';
      if (consecutiveFailures >= 3) {
        newStatus = 'currently_unavailable';
      }

      dbStore.saveModelHealthStatus(model.id, newStatus, consecutiveFailures, new Date().toISOString());

      const catalogModel = modelCatalog.getModelById(model.id);
      if (catalogModel) {
        catalogModel.status = newStatus;
        if (catalogModel.runtimeStats) {
          catalogModel.runtimeStats.consecutiveRouteFailures = consecutiveFailures;
        }
      }
    }

    return results;
  }
}


// ════ MODELHEALTHSERVICE IMPLEMENTATION ═══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const modelHealthService = ModelHealthService.getInstance();
export default modelHealthService;