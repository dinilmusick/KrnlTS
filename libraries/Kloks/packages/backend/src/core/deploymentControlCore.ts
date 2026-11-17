/**
 * Provider deployment-control operations.
 *
 * Vercel: pauses/resumes a project's production service.
 * Cloudflare Pages: disables/enables automatic production and preview deployments.
 */

import { getSrklAccounts } from './srklCore';

export type CloudflarePagesPreviewSetting = 'all' | 'none' | 'custom';

export interface CloudflarePagesPauseState {
  productionDeploymentsEnabled: boolean;
  previewDeploymentSetting: CloudflarePagesPreviewSetting;
}

export interface DeploymentControlResult {
  success: true;
  provider: 'VERCEL' | 'CLOUDFLARE';
  projectId: string;
  controlState: 'ACTIVE' | 'PAUSED';
  pauseState?: CloudflarePagesPauseState;
}

interface CredentialPayload {
  token?: string;
  apiToken?: string;
  accessToken?: string;
  teamId?: string;
  accountId?: string;
  cfAccountId?: string;
  accountTag?: string;
  authKey?: string;
  globalApiKey?: string;
  authEmail?: string;
  email?: string;
  credentials?: Record<string, any>;
}

function firstString(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() || '';
}

async function resolveVercelCredentials(payload: CredentialPayload, userId?: string, env?: Record<string, unknown>) {
  const credentials = payload.credentials || {};
  let token = firstString(payload.token, payload.apiToken, payload.accessToken, credentials.token, credentials.apiToken, credentials.accessToken);
  let teamId = firstString(payload.teamId, credentials.teamId);

  if ((!token || !teamId) && userId && (payload.accountId || credentials.accountId)) {
    const accountId = firstString(payload.accountId, credentials.accountId);
    const srkl = await getSrklAccounts(userId, 'vercel', env);
    const account = srkl.accounts?.find((item: any) => item.id === accountId);
    const accountCredentials = account?.credentials || account?.metadata?.credentials || {};
    token ||= firstString(accountCredentials.token, accountCredentials.apiToken, accountCredentials.accessToken);
    teamId ||= firstString(accountCredentials.teamId);
  }

  if (!token) throw new Error('Vercel API token is missing or not configured for this account.');
  return { token, teamId };
}

async function resolveCloudflareCredentials(payload: CredentialPayload, userId?: string, env?: Record<string, unknown>) {
  const credentials = payload.credentials || {};
  let token = firstString(payload.token, payload.apiToken, payload.accessToken, credentials.token, credentials.apiToken, credentials.accessToken);
  let accountId = firstString(payload.accountId, payload.cfAccountId, payload.accountTag, credentials.accountId, credentials.cfAccountId, credentials.accountTag);
  let authKey = firstString(payload.authKey, payload.globalApiKey, credentials.authKey, credentials.globalApiKey);
  let authEmail = firstString(payload.authEmail, payload.email, credentials.authEmail, credentials.email);

  if ((!token && !authKey) || !accountId) {
    const requestedAccountId = firstString(payload.accountId, credentials.accountId);
    if (userId && requestedAccountId) {
      const srkl = await getSrklAccounts(userId, 'cloudflare', env);
      const account = srkl.accounts?.find((item: any) => item.id === requestedAccountId);
      const accountCredentials = account?.credentials || account?.metadata?.credentials || {};
      token ||= firstString(accountCredentials.token, accountCredentials.apiToken, accountCredentials.accessToken);
      accountId ||= firstString(accountCredentials.accountId, accountCredentials.cfAccountId, accountCredentials.accountTag);
      authKey ||= firstString(accountCredentials.authKey, accountCredentials.globalApiKey);
      authEmail ||= firstString(accountCredentials.authEmail, accountCredentials.email);
    }
  }

  if (!token && !authKey) throw new Error('Cloudflare API Token or Global API Key required.');
  if (!accountId) throw new Error('Cloudflare Account ID is required.');
  return { token, accountId, authKey, authEmail };
}

function cloudflareHeaders(token: string, authKey: string, authEmail: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': 'Kloks-DeploymentControl/1.0' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else { headers['X-Auth-Key'] = authKey; headers['X-Auth-Email'] = authEmail; }
  return headers;
}

async function assertOk(response: Response, provider: string): Promise<void> {
  if (response.ok) return;
  const body: any = await response.json().catch(() => ({}));
  const message = body?.error?.message || body?.errors?.[0]?.message || body?.message || response.statusText;
  throw new Error(`${provider} API error (${response.status}): ${message}`);
}

export async function pauseVercelProject(
  projectId: string,
  payload: CredentialPayload = {},
  userId?: string,
  env?: Record<string, unknown>
): Promise<DeploymentControlResult> {
  if (!projectId?.trim()) throw new Error('Vercel project ID is required.');
  const { token, teamId } = await resolveVercelCredentials(payload, userId, env);
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const response = await fetch(`https://api.vercel.com/v1/projects/${encodeURIComponent(projectId)}/pause${query}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  await assertOk(response, 'Vercel');
  return { success: true, provider: 'VERCEL', projectId, controlState: 'PAUSED' };
}

export async function resumeVercelProject(
  projectId: string,
  payload: CredentialPayload = {},
  userId?: string,
  env?: Record<string, unknown>
): Promise<DeploymentControlResult> {
  if (!projectId?.trim()) throw new Error('Vercel project ID is required.');
  const { token, teamId } = await resolveVercelCredentials(payload, userId, env);
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const response = await fetch(`https://api.vercel.com/v1/projects/${encodeURIComponent(projectId)}/unpause${query}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  await assertOk(response, 'Vercel');
  return { success: true, provider: 'VERCEL', projectId, controlState: 'ACTIVE' };
}

export async function pauseCloudflarePagesProject(
  projectName: string,
  payload: CredentialPayload = {},
  userId?: string,
  env?: Record<string, unknown>
): Promise<DeploymentControlResult> {
  if (!projectName?.trim()) throw new Error('Cloudflare Pages project name is required.');
  const { token, accountId, authKey, authEmail } = await resolveCloudflareCredentials(payload, userId, env);
  const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}`;
  const currentResponse = await fetch(base, { headers: cloudflareHeaders(token, authKey, authEmail) });
  await assertOk(currentResponse, 'Cloudflare');
  const current: any = await currentResponse.json();
  const config = current?.result?.source?.config;
  if (!config) throw new Error('Cloudflare Pages project has no source deployment configuration to pause.');

  const pauseState: CloudflarePagesPauseState = {
    productionDeploymentsEnabled: config.production_deployments_enabled !== false,
    previewDeploymentSetting: config.preview_deployment_setting || 'all',
  };
  const updateResponse = await fetch(base, {
    method: 'PATCH',
    headers: cloudflareHeaders(token, authKey, authEmail),
    body: JSON.stringify({
      source: {
        type: current?.result?.source?.type,
        config: {
          ...config,
          production_deployments_enabled: false,
          preview_deployment_setting: 'none',
        },
      },
    }),
  });
  await assertOk(updateResponse, 'Cloudflare');
  return { success: true, provider: 'CLOUDFLARE', projectId: projectName, controlState: 'PAUSED', pauseState };
}

export async function resumeCloudflarePagesProject(
  projectName: string,
  pauseState: CloudflarePagesPauseState,
  payload: CredentialPayload = {},
  userId?: string,
  env?: Record<string, unknown>
): Promise<DeploymentControlResult> {
  if (!projectName?.trim()) throw new Error('Cloudflare Pages project name is required.');
  if (!pauseState) throw new Error('Cloudflare Pages pause state is required to resume safely.');
  const { token, accountId, authKey, authEmail } = await resolveCloudflareCredentials(payload, userId, env);
  const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}`;
  const currentResponse = await fetch(base, { headers: cloudflareHeaders(token, authKey, authEmail) });
  await assertOk(currentResponse, 'Cloudflare');
  const current: any = await currentResponse.json();
  const config = current?.result?.source?.config;
  if (!config) throw new Error('Cloudflare Pages project has no source deployment configuration to resume.');

  const updateResponse = await fetch(base, {
    method: 'PATCH',
    headers: cloudflareHeaders(token, authKey, authEmail),
    body: JSON.stringify({
      source: {
        type: current?.result?.source?.type,
        config: {
          ...config,
          production_deployments_enabled: pauseState.productionDeploymentsEnabled,
          preview_deployment_setting: pauseState.previewDeploymentSetting,
        },
      },
    }),
  });
  await assertOk(updateResponse, 'Cloudflare');
  return { success: true, provider: 'CLOUDFLARE', projectId: projectName, controlState: 'ACTIVE' };
}
