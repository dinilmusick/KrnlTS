import { SkipoBase } from '@kloks/functions';
import { ClusterConfig, HealthStatus } from './types.js';

export class DatabaseClusterManager extends SkipoBase {
  private config: ClusterConfig;
  private health: Map<string, HealthStatus> = new Map();

  constructor(config: ClusterConfig) {
    super();
    this.config = config;
  }

  async probe(node: string): Promise<HealthStatus> {
    const start = Date.now();
    // In a real implementation, this would ping the DB node
    const latency = Date.now() - start;
    const status: HealthStatus = {
      status: 'healthy',
      latencyMs: latency,
      lastCheck: Date.now()
    };
    this.health.set(node, status);
    return status;
  }

  getPrimary(): string {
    return this.config.primary;
  }

  getNodes(): string[] {
    return this.config.nodes;
  }

  static fromEnvironment(_unused?: any, env: Record<string, string | undefined> = process.env): DatabaseClusterManager {
    const urls: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const val = env[`SYSTEM_DATABASE_URL_${i}`] || (i === 1 ? env.SYSTEM_DATABASE_URL : undefined);
      if (val) urls.push(val);
    }
    const primary = urls[0] || 'postgres://localhost:5432/default';
    return new DatabaseClusterManager({
      primary,
      nodes: urls.length > 0 ? urls : [primary],
    });
  }

  async failover(): Promise<void> {
    for (const node of this.config.nodes) {
      if (node !== this.config.primary) {
        const h = await this.probe(node);
        if (h.status === 'healthy') {
          this.config.primary = node;
          break;
        }
      }
    }
  }
}

export function detectDatabaseEngine(url?: string): string {
  if (!url) return 'postgres';
  if (url.startsWith('postgres') || url.startsWith('postgresql')) return 'postgres';
  if (url.startsWith('sqlite')) return 'sqlite';
  if (url.startsWith('mysql')) return 'mysql';
  return 'postgres';
}

export function getSystemDatabaseUrls(env: Record<string, string | undefined> = process.env): string[] {
  const urls: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const val = env[`SYSTEM_DATABASE_URL_${i}`] || (i === 1 ? env.SYSTEM_DATABASE_URL : undefined);
    if (val) urls.push(val);
  }
  return urls;
}

export function resolveSystemDatabaseClusterNodes(
  env: Record<string, string | undefined> = process.env
): Array<{ id: string; role: string; url: string; status: string }> {
  const urls = getSystemDatabaseUrls(env);
  return urls.map((url, idx) => ({
    id: `node-${idx + 1}`,
    role: idx === 0 ? 'primary' : `clone_${idx}`,
    url,
    status: 'healthy',
  }));
}
