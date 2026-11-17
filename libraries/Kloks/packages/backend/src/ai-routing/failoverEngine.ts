/**
 * @file failoverEngine.ts
 * @description Resilient AI execution router with multi-candidate auto-failover
 */

import type { RouteCandidate, RouteExecutionResult, RetryPolicy } from './types.js';
import { metricsLogger } from './metricsLogger.js';
import { healthCheckService } from './healthCheckService.js';

export class FailoverExecutionEngine {
  private defaultRetryPolicy: RetryPolicy = {
    maxRetries: 3,
    backoffMs: 250,
  };

  async executeWithFailover<T>(
    candidates: RouteCandidate[],
    executeCandidate: (candidate: RouteCandidate) => Promise<T>,
    policy?: Partial<RetryPolicy>
  ): Promise<RouteExecutionResult<T>> {
    const start = Date.now();
    const effectivePolicy = { ...this.defaultRetryPolicy, ...policy };
    const failoverHistory: Array<{ candidate: RouteCandidate; error: string; durationMs: number }> = [];

    // Filter by health if healthy candidates exist
    const healthyCandidates = candidates.filter((c) =>
      healthCheckService.isRouteAvailable(c.providerId, c.modelId)
    );
    const candidateQueue = healthyCandidates.length > 0 ? healthyCandidates : candidates;

    let attempts = 0;
    for (const candidate of candidateQueue) {
      if (attempts >= effectivePolicy.maxRetries) break;
      attempts++;
      const attemptStart = Date.now();

      try {
        const result = await executeCandidate(candidate);
        const duration = Date.now() - attemptStart;

        healthCheckService.recordRouteSuccess(candidate.providerId, candidate.modelId, duration);
        metricsLogger.log({
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          durationMs: duration,
          success: true,
        });

        return {
          success: true,
          selectedCandidate: candidate,
          attempts,
          result,
          totalDurationMs: Date.now() - start,
          failoverHistory,
        };
      } catch (err: unknown) {
        const duration = Date.now() - attemptStart;
        const errMessage = err instanceof Error ? err.message : String(err);

        healthCheckService.recordRouteFailure(candidate.providerId, candidate.modelId, errMessage);
        metricsLogger.log({
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          durationMs: duration,
          success: false,
          error: errMessage,
        });

        failoverHistory.push({
          candidate,
          error: errMessage,
          durationMs: duration,
        });

        if (effectivePolicy.backoffMs > 0 && attempts < effectivePolicy.maxRetries) {
          await new Promise((r) => setTimeout(r, effectivePolicy.backoffMs));
        }
      }
    }

    return {
      success: false,
      attempts,
      error: `All ${attempts} candidate execution attempts failed`,
      totalDurationMs: Date.now() - start,
      failoverHistory,
    };
  }
}

export const failoverExecutionEngine = new FailoverExecutionEngine();
