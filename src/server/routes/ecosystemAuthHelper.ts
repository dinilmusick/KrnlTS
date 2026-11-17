/**
 * @file ecosystemAuthHelper.ts
 * @description Secure Authentication & Authorization Boundary for SRKL Ecosystem Broker.
 * Separates authentication (caller identity) from authorization (credential & workspace access).
 * Strictly conforms to Skipo governance (< 200 lines).
 */

import { Request } from 'express';
import { getVerifiedPrincipal } from '../luthSession';
import { query } from '../db';
import { AppAccountManifest } from '@/libraries/types/ecosystem';

export interface AuthenticatedPrincipal {
  userId: string;
  sessionId?: string;
}

export interface EcosystemAuthDecision {
  error?: string;
  statusCode?: number;
  userId: string;
  workspaceId: string;
  includeCredentials: boolean;
}

type AppAuthorizationLookup = (sql: string, params: any[]) => Promise<{ rows: any[] }>;
let appAuthorizationLookupForTesting: AppAuthorizationLookup | null = null;

/** Identity is trusted only after AppFactory has verified the Luth session. */
export function authenticateRequest(req: Request): AuthenticatedPrincipal | null {
  const principal = getVerifiedPrincipal(req);
  if (!principal?.id) return null;
  return { userId: principal.id };
}

/** Test seam: force registry success/failure without connecting to the system database. */
export function setAppAuthorizationLookupForTesting(lookup: AppAuthorizationLookup | null): void {
  appAuthorizationLookupForTesting = lookup;
}

/** The canonical app registry is authoritative; registry errors must fail closed. */
export async function isAuthorizedAppForCredentials(appId: string): Promise<boolean> {
  if (!appId) return false;
  const clean = appId.toLowerCase().trim();
  const canonical = clean.replace(/-engine$/, '');
  try {
    const sql = 'SELECT app_id, status FROM "ultrst-apps" WHERE app_id = $1 OR app_id = $2';
    const params = [clean, canonical];
    const res = appAuthorizationLookupForTesting
      ? await appAuthorizationLookupForTesting(sql, params)
      : await query(sql, params);
    return res.rows.some((r: any) => r.status === 'active');
  } catch {
    return false;
  }
}

export type WorkspaceResolver = (userId: string) => Promise<{ workspaces: any[]; activeWorkspaceId: string } | null> | { workspaces: any[]; activeWorkspaceId: string } | null;

let customWorkspaceResolver: WorkspaceResolver | null = null;
export function setWorkspaceResolverForTesting(fn: WorkspaceResolver | null): void {
  customWorkspaceResolver = fn;
}

export async function verifyWorkspaceOwnership(
  userId: string,
  targetWsId?: string
): Promise<{ authorized: boolean; effectiveWsId: string; error?: string }> {
  try {
    let workspaces: any[] = [];
    let activeWsId = '';

    if (customWorkspaceResolver) {
      const resolved = await customWorkspaceResolver(userId);
      if (!resolved) return { authorized: false, effectiveWsId: '', error: 'User profile not found' };
      workspaces = resolved.workspaces || [];
      activeWsId = resolved.activeWorkspaceId || workspaces[0]?.id || '';
    } else {
      const res = await query('SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $1 LIMIT 1', [userId]);
      if (res.rows.length === 0) return { authorized: false, effectiveWsId: '', error: 'User profile not found' };
      const p = typeof res.rows[0].app_profiles === 'string' ? JSON.parse(res.rows[0].app_profiles) : (res.rows[0].app_profiles || {});
      workspaces = p.srkl?.workspaces || [];
      activeWsId = p.srkl?.activeWorkspaceId || workspaces[0]?.id || '';
    }

    if (targetWsId && targetWsId !== 'active') {
      const owns = workspaces.some((w: any) => w.id === targetWsId);
      if (!owns) {
        return { authorized: false, effectiveWsId: '', error: 'Forbidden: workspace does not belong to authenticated user' };
      }
      return { authorized: true, effectiveWsId: targetWsId };
    }
    return { authorized: true, effectiveWsId: activeWsId };
  } catch (err: any) {
    return { authorized: false, effectiveWsId: '', error: err.message };
  }
}

export async function authorizeEcosystemAccess(
  req: Request,
  manifest?: AppAccountManifest,
  targetWsParam?: string
): Promise<EcosystemAuthDecision> {
  const principal = authenticateRequest(req);
  const callerUserId = ((req.query.userId || req.body?.userId) as string | undefined)?.trim();

  if (principal && callerUserId && callerUserId !== principal.userId) {
    return {
      error: `Forbidden: authenticated principal "${principal.userId}" cannot access accounts for requested user "${callerUserId}"`,
      statusCode: 403,
      userId: '',
      workspaceId: '',
      includeCredentials: false,
    };
  }

  const effectiveUserId = principal?.userId || '';
  if (!principal || !effectiveUserId) {
    return { error: 'A logged-in ecosystem user ID is required.', statusCode: 401, userId: '', workspaceId: '', includeCredentials: false };
  }

  const wsCheck = await verifyWorkspaceOwnership(effectiveUserId, targetWsParam);
  if (!wsCheck.authorized) {
    return { error: wsCheck.error || 'Forbidden: workspace access denied', statusCode: 403, userId: effectiveUserId, workspaceId: '', includeCredentials: false };
  }

  const appId = ((req.headers['x-app-id'] || manifest?.appId || '') as string).toLowerCase().trim();
  const isAppAuthorized = await isAuthorizedAppForCredentials(appId);
  const includeCredentials = Boolean(manifest?.includeCredentials) && isAppAuthorized;

  return { userId: effectiveUserId, workspaceId: wsCheck.effectiveWsId, includeCredentials };
}
