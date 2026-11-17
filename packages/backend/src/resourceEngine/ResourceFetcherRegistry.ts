// ══════════════════════════════════════════════════════════════════════════════
// RESOURCE FETCHER REGISTRY (DYNAMIC MULTI-PROVIDER DISPATCH & ADAPTER ENGINE)
// ══════════════════════════════════════════════════════════════════════════════
import { ProviderType } from './types/depm/base';
import { AccountEntity, DeploymentEntity } from './types/depm/entities';
import { BaseResourceFetcher } from './BaseResourceFetcher';
import { VercelResourceFetcher } from './VercelResourceFetcher';
import { CloudflareResourceFetcher } from './CloudflareResourceFetcher';
import { UnifiedResourceMetrics } from './types';
import { UniversalResourceCalculator } from './calculator/UniversalResourceCalculator';
import { VercelResourceAdapter } from './adapters/VercelResourceAdapter';
import { CloudflareResourceAdapter } from './adapters/CloudflareResourceAdapter';
import {
  IResourceProviderAdapter,
  GeneralizedResourceVector,
  ResourceCalculationResult,
} from './calculator/types';

export class ResourceFetcherRegistry {
  private static fetchers = new Map<string, BaseResourceFetcher>();
  private static adapters = new Map<string, IResourceProviderAdapter>();
  private static defaultFetcher: BaseResourceFetcher;
  private static defaultAdapter: IResourceProviderAdapter;

  static {
    const vercel = new VercelResourceFetcher();
    const cloudflare = new CloudflareResourceFetcher();
    const vercelAdapter = new VercelResourceAdapter();
    const cloudflareAdapter = new CloudflareResourceAdapter();

    this.register(vercel);
    this.register(cloudflare);

    this.adapters.set('VERCEL', vercelAdapter);
    this.adapters.set('CLOUDFLARE', cloudflareAdapter);
    this.adapters.set('CLOUDFLARE_WORKERS', cloudflareAdapter);
    this.adapters.set('CLOUDFLARE_PAGES', cloudflareAdapter);

    // Aliases
    this.fetchers.set('CLOUDFLARE_WORKERS', cloudflare);
    this.fetchers.set('CLOUDFLARE_PAGES', cloudflare);

    this.defaultFetcher = vercel;
    this.defaultAdapter = vercelAdapter;
  }

  public static register(fetcher: BaseResourceFetcher): void {
    this.fetchers.set(fetcher.provider.toUpperCase(), fetcher);
  }

  public static getFetcher(provider?: ProviderType | string): BaseResourceFetcher {
    if (!provider) return this.defaultFetcher;
    const clean = provider.toUpperCase().trim();
    return this.fetchers.get(clean) || this.defaultFetcher;
  }

  public static getAdapter(provider?: ProviderType | string): IResourceProviderAdapter {
    if (!provider) return this.defaultAdapter;
    const clean = provider.toUpperCase().trim();
    return this.adapters.get(clean) || this.defaultAdapter;
  }

  public static getSupportedProviders(): string[] {
    return Array.from(this.fetchers.keys());
  }

  /**
   * Dynamically fetches live metrics for an account using its matching provider fetcher.
   */
  public static async fetchAccountMetrics(account: AccountEntity): Promise<UnifiedResourceMetrics> {
    const fetcher = this.getFetcher(account.provider);
    return fetcher.fetchMetrics(account);
  }

  /**
   * Computes the normalized resource weight score (0.00 to 1.00) using the decoupled Universal Calculator.
   */
  public static computeScore(account?: AccountEntity, deployment?: DeploymentEntity): number {
    const detailed = this.calculateDetailedScore(account, deployment);
    return detailed.effectiveWeight;
  }

  /**
   * Full calculation returning effective weight, percent remaining, and dominant bottleneck.
   */
  public static calculateDetailedScore(
    account?: AccountEntity,
    deployment?: DeploymentEntity
  ): ResourceCalculationResult {
    if (!account && !deployment) {
      return UniversalResourceCalculator.calculateWeight({
        provider: 'VERCEL',
        tier: 'hobby',
        periodLabel: 'Default',
        metrics: [],
      });
    }

    const provider = account?.provider || deployment?.provider || 'VERCEL';
    const adapter = this.getAdapter(provider);
    const existing = (account as any)?.unifiedMetrics || (account as any)?.usageMetrics;

    const vector: GeneralizedResourceVector = adapter.transformToGeneralizedVector(
      (account as any)?.rawUsagePayload,
      (account?.tier as string) || adapter.defaultTier,
      account?.deploymentCount || 1,
      existing
    );

    return UniversalResourceCalculator.calculateWeight(vector);
  }
}
