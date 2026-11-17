/**
 * @file SrklDeploymentRegistry.ts
 * @description Idempotent runtime registration and discovery of SRKL deployment URLs.
 * Conforms to Rule L9 (<= 200 lines) and supports multi-deployment round-robin.
 */

import { neon } from '@neondatabase/serverless';
import { getUnifiedDbUrls } from '../services/core/unifiedDb';

export interface SrklDeploymentRecord {
  id: string;
  url: string;
  label?: string;
  environment?: string;
  isActive: boolean;
  isPrimary?: boolean;
  priority?: number;
}

const registeredUrls = new Set<string>();

export function cleanDeploymentUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.origin.replace(/\/+$/, '');
  } catch {
    return rawUrl.trim().replace(/\/+$/, '');
  }
}

function computeDeploymentId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return `srkl-${Math.abs(hash).toString(36)}`;
}

export async function bootstrapSrklDeploymentsTable(databaseUrl: string): Promise<void> {
  const sql = neon(databaseUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS public."ultrst-srkl-deployments" (
      id varchar(120) PRIMARY KEY,
      url text NOT NULL UNIQUE,
      label varchar(255) NOT NULL DEFAULT 'SRKL Engine Deployment',
      environment varchar(32) NOT NULL DEFAULT 'production',
      is_active boolean NOT NULL DEFAULT true,
      is_primary boolean NOT NULL DEFAULT false,
      priority integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS ultrst_srkl_deployments_active_idx
      ON public."ultrst-srkl-deployments" (is_active, priority DESC, is_primary DESC)
  `;
}

export async function registerSrklDeployment(
  env: Record<string, unknown> = {},
  rawUrl: string,
  options: { label?: string; isPrimary?: boolean; priority?: number; force?: boolean } = {}
): Promise<{ registered: boolean; url: string; id: string }> {
  const normalizedUrl = cleanDeploymentUrl(rawUrl);
  if (!normalizedUrl) throw new Error('INVALID_DEPLOYMENT_URL');

  const dbUrls = getUnifiedDbUrls(env);
  const databaseUrl = dbUrls[0];
  if (!databaseUrl) throw new Error('SYSTEM_DATABASE_UNAVAILABLE');

  const cacheKey = `${databaseUrl}|${normalizedUrl}`;
  if (!options.force && registeredUrls.has(cacheKey)) {
    return { registered: true, url: normalizedUrl, id: computeDeploymentId(normalizedUrl) };
  }

  await bootstrapSrklDeploymentsTable(databaseUrl);

  const id = computeDeploymentId(normalizedUrl);
  const label = options.label || 'SRKL Engine Deployment';
  const isPrimary = options.isPrimary ?? false;
  const priority = options.priority ?? 0;
  const environment = normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1')
    ? 'development'
    : normalizedUrl.includes('staging') ? 'staging' : 'production';

  const sql = neon(databaseUrl);
  await sql`
    INSERT INTO public."ultrst-srkl-deployments" (
      id, url, label, environment, is_active, is_primary, priority, updated_at
    )
    VALUES (
      ${id}, ${normalizedUrl}, ${label}, ${environment}, true, ${isPrimary}, ${priority}, CURRENT_TIMESTAMP
    )
    ON CONFLICT (url) DO UPDATE SET
      is_active = true,
      updated_at = CURRENT_TIMESTAMP
  `;

  registeredUrls.add(cacheKey);
  return { registered: true, url: normalizedUrl, id };
}

export async function getRegisteredSrklDeployments(
  env: Record<string, unknown> = {}
): Promise<SrklDeploymentRecord[]> {
  const dbUrls = getUnifiedDbUrls(env);
  const databaseUrl = dbUrls[0];
  if (!databaseUrl) return [];

  try {
    const sql = neon(databaseUrl);
    const rows = await sql`
      SELECT id, url, label, environment, is_active, is_primary, priority
      FROM public."ultrst-srkl-deployments"
      WHERE is_active = true
      ORDER BY is_primary DESC, priority DESC, created_at ASC
    `;
    return (rows as any[]).map((r) => ({
      id: String(r.id),
      url: cleanDeploymentUrl(String(r.url)),
      label: r.label,
      environment: r.environment,
      isActive: Boolean(r.is_active),
      isPrimary: Boolean(r.is_primary),
      priority: Number(r.priority || 0),
    }));
  } catch {
    return [];
  }
}

export function clearSrklDeploymentCache(): void {
  registeredUrls.clear();
}
