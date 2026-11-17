/**
 * @file cloudRunScanner.ts
 * @description Cloud Run Service API client & parser for Google AI Studio developing applications.
 * Directly queries https://run.googleapis.com/v2/projects/{projectId}/locations/-/services
 * File size < 200 lines strictly.
 */

import { AiStudioApp } from './routes/googleAiStudioCatalog';

export interface CloudRunQueryOptions {
  projectId: string;
  token?: string;
  apiKey?: string;
  googleAccount: string;
}

export interface CloudRunQueryResult {
  success: boolean;
  queried: boolean;
  projectId: string;
  servicesCount: number;
  apps: AiStudioApp[];
  error?: string;
  status?: number;
  hint?: string;
}

/**
 * Attempts to retrieve an ambient GCP compute metadata service account access token.
 */
async function getAmbientMetadataToken(): Promise<string | null> {
  try {
    const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      return (data.access_token as string) || null;
    }
  } catch {}
  return null;
}

/**
 * Formats a raw Google Cloud Run Service v2 object into an AiStudioApp.
 */
export function formatCloudRunService(raw: any, googleAccount: string, projectId: string): AiStudioApp {
  const nameStr = String(raw.name || '');
  const parts = nameStr.split('/');
  const serviceId = parts[parts.length - 1] || 'cloud-run-service';
  const uri = String(raw.uri || '');

  const isDev = serviceId.startsWith('ais-dev-');
  const isPre = serviceId.startsWith('ais-pre-');

  let devUrl = uri;
  let shareUrl = uri;
  let platform: AiStudioApp['platform'] = 'Cloud Run';
  let status: AiStudioApp['status'] = 'DEPLOYED';

  if (isDev) {
    status = 'DEVELOPMENT';
    platform = 'Web (React + Vite)';
    devUrl = uri;
    shareUrl = uri.replace('ais-dev-', 'ais-pre-');
  } else if (isPre) {
    status = 'STAGING';
    platform = 'Web (React + Vite)';
    shareUrl = uri;
    devUrl = uri.replace('ais-pre-', 'ais-dev-');
  }

  const appletId =
    raw.labels?.['goog-applet-id'] ||
    raw.labels?.['applet-id'] ||
    serviceId.replace(/^(ais-dev-|ais-pre-)/, '') ||
    serviceId;

  const displayName =
    raw.labels?.['app-name'] ||
    (isDev
      ? `AI Studio App (Dev: ${serviceId.replace('ais-dev-', '')})`
      : isPre
      ? `AI Studio App (Preview: ${serviceId.replace('ais-pre-', '')})`
      : serviceId);

  return {
    id: `cloudrun-${serviceId}`,
    name: displayName,
    description: raw.description || `Google Cloud Run Service deployed in Google AI Studio (${uri || 'managed'})`,
    googleAccount: googleAccount.trim().toLowerCase(),
    appletId,
    platform,
    status,
    model: 'Gemini 2.5 Flash',
    projectId,
    devUrl,
    shareUrl,
    updatedAt: raw.updateTime || raw.createTime || new Date().toISOString(),
  };
}

/**
 * Detects the currently active Cloud Run development container running this workspace.
 */
export function getActiveWorkspaceCloudRunApp(
  googleAccount: string,
  projectId?: string,
  runtime: { appUrl?: string; serviceName?: string; appletId?: string } = {},
): AiStudioApp | null {
  const appUrl = runtime.appUrl || '';
  const kService = runtime.serviceName || '';
  const appletId = runtime.appletId || '';

  if (!appUrl && !kService && !appletId) return null;

  const currentDevUrl = appUrl || (kService ? `https://${kService}-207414612407.asia-southeast1.run.app` : '');
  const currentShareUrl = currentDevUrl.replace('ais-dev-', 'ais-pre-');

  return {
    id: `current-workspace-${appletId || 'cloudrun'}`,
    name: 'SRKL (Live Development Workspace)',
    description: 'Active Google AI Studio live Cloud Run development container and preview runtime',
    googleAccount: googleAccount.trim().toLowerCase(),
    appletId: appletId || kService || 'cloudrun',
    platform: 'Web (React + Vite)',
    status: 'DEVELOPMENT',
    model: 'Gemini 2.5 Flash',
    projectId: projectId || '207414612407',
    devUrl: currentDevUrl,
    shareUrl: currentShareUrl,
    updatedAt: new Date().toISOString(),
    isCurrentWorkspace: true,
  };
}

/**
 * Queries Google Cloud Run Service API for deployed services across all locations.
 * URL: https://run.googleapis.com/v2/projects/{projectId}/locations/-/services
 */
export async function queryCloudRunServices(opts: CloudRunQueryOptions): Promise<CloudRunQueryResult> {
  const targetProject = (opts.projectId || '207414612407').trim();
  const bearerToken = opts.token || (await getAmbientMetadataToken());

  let targetUrl = `https://run.googleapis.com/v2/projects/${encodeURIComponent(targetProject)}/locations/-/services`;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  } else if (opts.apiKey) {
    headers['x-goog-api-key'] = opts.apiKey;
    targetUrl += `?key=${encodeURIComponent(opts.apiKey)}`;
  }

  try {
    const res = await fetch(targetUrl, { headers, signal: AbortSignal.timeout(9000) });
    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || `Google Cloud Run API returned status ${res.status}`;
      return {
        success: false,
        queried: true,
        projectId: targetProject,
        servicesCount: 0,
        apps: [],
        status: res.status,
        error: errMsg,
        hint:
          res.status === 401
            ? 'Cloud Run Service API requires an OAuth 2.0 access token with run.services.list permission.'
            : res.status === 403
            ? `Permission 'run.services.list' denied on project '${targetProject}'. Attach Cloud Run Viewer role or provide project access token.`
            : 'Check GCP project configuration and Cloud Run Admin API activation.',
      };
    }

    const rawServices = Array.isArray(data.services) ? data.services : [];
    const formattedApps = rawServices.map((s: any) => formatCloudRunService(s, opts.googleAccount, targetProject));

    return {
      success: true,
      queried: true,
      projectId: targetProject,
      servicesCount: formattedApps.length,
      apps: formattedApps,
    };
  } catch (err: unknown) {
    return {
      success: false,
      queried: true,
      projectId: targetProject,
      servicesCount: 0,
      apps: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
