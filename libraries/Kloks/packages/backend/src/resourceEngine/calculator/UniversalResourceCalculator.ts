// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL RESOURCE CALCULATOR (DECOUPLED TOP-LEVEL MATHEMATICAL ENGINE)
// Pure computation independent of specific cloud vendor APIs (< 200 lines)
// ══════════════════════════════════════════════════════════════════════════════
import {
  GeneralizedResourceMetric,
  GeneralizedResourceVector,
  ResourceCalculationResult,
} from './types';

export class UniversalResourceCalculator {
  /**
   * Calculates the normalized multi-dimensional resource weight score (0.00 to 1.00)
   * from a GeneralizedResourceVector. Higher remaining capacity yields a higher weight.
   */
  public static calculateWeight(vector: GeneralizedResourceVector): ResourceCalculationResult {
    const metrics = vector.metrics || [];
    if (metrics.length === 0) {
      return this.buildDefaultResult(vector.provider);
    }

    let weightedSum = 0;
    let totalWeight = 0;
    let lowestMetric: GeneralizedResourceMetric | null = null;
    let lowestRemainingRatio = Infinity;

    for (const metric of metrics) {
      if (!metric.limit || metric.limit <= 0) continue;

      const remaining = Math.max(0, metric.limit - metric.used);
      const ratio = Math.max(0, Math.min(1, remaining / metric.limit));

      // Prioritize active monthly depletable resources for bottleneck discovery
      const candidateKey = metric.isMonthlyDepletable ? ratio : ratio + 0.1;
      if (candidateKey < lowestRemainingRatio) {
        lowestRemainingRatio = candidateKey;
        lowestMetric = metric;
      }

      const weight = metric.importanceWeight > 0 ? metric.importanceWeight : 0.05;
      weightedSum += ratio * weight;
      totalWeight += weight;
    }

    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 1.0;
    const clampedScore = Math.max(0.01, Math.min(1.0, Math.round(rawScore * 100) / 100));
    const percentRemaining = Math.round(clampedScore * 100);

    const bottleneck = lowestMetric || metrics[0] || this.buildFallbackMetric();
    const summaryLabel = this.formatSummaryLabel(bottleneck);

    return {
      effectiveWeight: clampedScore,
      percentRemaining,
      dominantBottleneck: bottleneck,
      metrics,
      summaryLabel,
    };
  }

  /**
   * Formats a concise, human-readable summary label for node displays (e.g. 'CPU: 30m 27s (87% rem)').
   */
  public static formatSummaryLabel(metric: GeneralizedResourceMetric): string {
    const shortCategory =
      metric.category === 'compute' ? 'CPU' :
      metric.category === 'memory' ? 'Memory' :
      metric.category === 'execution' ? 'Calls' :
      metric.category === 'requests' ? 'Requests' :
      metric.category === 'network' ? 'Bandwidth' : 'Storage';

    return `${shortCategory}: ${metric.usedFormatted} (${metric.percentRemaining}% rem)`;
  }

  private static buildDefaultResult(provider: string): ResourceCalculationResult {
    const fallback = this.buildFallbackMetric();
    return {
      effectiveWeight: 1.0,
      percentRemaining: 100,
      dominantBottleneck: fallback,
      metrics: [fallback],
      summaryLabel: `${provider}: 100% capacity`,
    };
  }

  private static buildFallbackMetric(): GeneralizedResourceMetric {
    return {
      id: 'default_capacity',
      name: 'Account Capacity',
      category: 'compute',
      used: 0,
      limit: 100,
      unit: '%',
      usedFormatted: '0%',
      limitFormatted: '100%',
      remainingFormatted: '100%',
      percentUsed: 0,
      percentRemaining: 100,
      isMonthlyDepletable: true,
      importanceWeight: 1.0,
    };
  }
}
