/**
 * @file metricsLogger.ts
 * @description Latency, throughput, and token usage metrics logger for AI operations
 */

import type { ProviderId } from '../ai-provider/types.js';

export interface AIMetricRecord {
  id: string;
  timestamp: string;
  providerId: ProviderId;
  modelId: string;
  durationMs: number;
  success: boolean;
  promptTokens?: number;
  completionTokens?: number;
  error?: string;
}

export class MetricsLogger {
  private records: AIMetricRecord[] = [];
  private readonly maxRecords: number = 2000;

  logRequest(record: {
    providerId: ProviderId;
    modelId: string;
    latencyMs: number;
    status?: string;
    clientIp?: string;
    profileRequested?: unknown;
    selectedModel?: string;
    selectedProvider?: ProviderId;
    selectedKeyId?: string;
    tokensUsed?: number;
    statusCode?: number;
    failoverOccurred?: boolean;
    failoverChain?: string[];
    promptSnippet?: string;
    responseSnippet?: string;
    toolCalls?: unknown;
    toolsProvided?: unknown;
  }): void {
    this.log({
      providerId: record.providerId,
      modelId: record.modelId,
      durationMs: record.latencyMs,
      success: record.status !== 'failure',
    });
  }

  getLogs(limit = 50): AIMetricRecord[] {
    return this.records.slice(-limit);
  }

  getMetricsSummary(): {
    totalRequests: number;
    successRatePercent: number;
    averageLatencyMs: number;
    totalFailovers: number;
  } {
    const totalRequests = this.records.length;
    const successes = this.records.filter((record) => record.success).length;
    const averageLatencyMs = totalRequests
      ? Math.round(this.records.reduce((sum, record) => sum + record.durationMs, 0) / totalRequests)
      : 0;
    return {
      totalRequests,
      successRatePercent: totalRequests ? Math.round((successes / totalRequests) * 100) : 100,
      averageLatencyMs,
      totalFailovers: 0,
    };
  }

  log(record: Omit<AIMetricRecord, 'id' | 'timestamp'>): void {
    const full: AIMetricRecord = {
      id: `met_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...record,
    };
    this.records.push(full);
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
  }

  getRecent(limit: number = 50): AIMetricRecord[] {
    return this.records.slice(-limit);
  }

  getAverageLatency(providerId: ProviderId, modelId?: string): number {
    const matches = this.records.filter(
      (r) => r.providerId === providerId && (modelId ? r.modelId === modelId : true) && r.success
    );
    if (matches.length === 0) return 0;
    const sum = matches.reduce((acc, r) => acc + r.durationMs, 0);
    return Math.round(sum / matches.length);
  }

  getSuccessRate(providerId: ProviderId): number {
    const matches = this.records.filter((r) => r.providerId === providerId);
    if (matches.length === 0) return 100;
    const successes = matches.filter((r) => r.success).length;
    return Math.round((successes / matches.length) * 100);
  }
}

export const metricsLogger = new MetricsLogger();
