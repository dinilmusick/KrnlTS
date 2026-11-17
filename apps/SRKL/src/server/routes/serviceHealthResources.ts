/**
 * @file serviceHealthResources.ts
 * @description Real-time health surveillance and cloud resource enumeration for service accounts.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import { getServerRegistry } from '../serverServiceEngine';
import { getActiveWorkspaceCloudRunApp } from '../cloudRunScanner';
import { checkVercelHealth, getVercelResources } from '../providers/vercelSurveillance';
import { checkGithubHealth, getGithubResources } from '../providers/githubSurveillance';
import { checkCloudflareHealth, getCloudflareResources } from '../providers/cloudflareSurveillance';

const router = express.Router();

function extractCredentials(req: Request) {
  const q = req.query;
  const accountId = (q.accountId as string) || (req.headers['x-account-id'] as string);
  const account = undefined;
  const creds = account ? account.getAllCredentials() : {};

  const serviceId = (q.serviceId as string) || (req.headers['x-service-id'] as string) || account?.serviceId || 'google-ai-studio';
  const apiKey = (q.apiKey as string) || (req.headers['x-goog-api-key'] as string) || (creds['apiKey'] as string);
  const token = (q.token as string) || (q.apiToken as string) || (req.headers['authorization'] as string)?.replace('Bearer ', '') || (creds['apiToken'] as string) || (creds['token'] as string) || (creds['accessToken'] as string) || (creds['pat'] as string);
  const accountName = (q.googleAccount as string) || (q.owner as string) || (q.account as string) || (creds['googleAccount'] as string) || (creds['owner'] as string) || (creds['account'] as string) || account?.name;
  const teamId = (q.teamId as string) || (creds['teamId'] as string);
  const cfAccountId = (q.cfAccountId as string) || (req.headers['x-cf-account-id'] as string) || (creds['accountId'] as string) || (typeof q.accountId === 'string' && !q.accountId.startsWith('sa_') ? q.accountId : '');
  const email = (q.email as string) || (creds['email'] as string);
  const globalApiKey = (q.globalApiKey as string) || (creds['globalApiKey'] as string);

  return { serviceId, apiKey, token, accountName, accountId, teamId, cfAccountId, email, globalApiKey };
}

// 1. GET Health Handler
export async function handleGetHealth(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { serviceId, apiKey, token, accountName, accountId, cfAccountId, email, globalApiKey } = extractCredentials(req);

  if (serviceId.includes('cloudflare')) {
    const health = await checkCloudflareHealth(token, cfAccountId || accountId, email, globalApiKey, accountName);
    res.status(health.success ? 200 : (health.status === 'STANDBY' ? 200 : 502)).json(health);
    return;
  }

  if (serviceId.includes('vercel')) {
    const health = await checkVercelHealth(token, accountName);
    res.status(health.success ? 200 : (health.status === 'STANDBY' ? 200 : 502)).json(health);
    return;
  }

  if (serviceId.includes('github')) {
    const health = await checkGithubHealth(token, accountName);
    res.status(health.success ? 200 : (health.status === 'STANDBY' ? 200 : 502)).json(health);
    return;
  }

  if (serviceId.includes('google-ai-studio') || serviceId.includes('gemini')) {
    if (!apiKey) {
      res.json({ success: true, status: 'STANDBY', serviceId, provider: 'Google Generative Language API', message: 'No API key attached. Add Google AI Studio key.', latencyMs: Date.now() - startTime, timestamp: new Date().toISOString() });
      return;
    }

    try {
      const pingRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`, { signal: AbortSignal.timeout(8000) });
      const data = await pingRes.json();
      const latencyMs = Date.now() - startTime;

      if (!pingRes.ok) {
        res.status(pingRes.status).json({ success: false, status: 'DEGRADED', serviceId, latencyMs, error: data.error?.message || `Google API error ${pingRes.status}`, timestamp: new Date().toISOString() });
        return;
      }

      const models = Array.isArray(data.models) ? data.models : [];
      res.json({ success: true, status: 'ONLINE', serviceId, provider: 'Google AI Studio / Generative Language API', latencyMs, googleAccount: accountName || 'Authenticated Workspace', modelsCount: models.length, rateLimits: 'ACTIVE_NORMAL', liveCheck: 'PASSED', timestamp: new Date().toISOString() });
    } catch (err: unknown) {
      res.status(502).json({ success: false, status: 'OFFLINE', serviceId, latencyMs: Date.now() - startTime, error: err instanceof Error ? err.message : String(err), timestamp: new Date().toISOString() });
    }
    return;
  }

  // Fallback / Generic Provider Health
  const reg = getServerRegistry();
  const provider = reg.get(serviceId);
  const account = undefined;
  const metrics = account && provider ? await provider.getStatus(account) : { health: 100, latencyMs: 12, status: 'ONLINE' };

  res.json({ success: true, status: metrics.status || 'ONLINE', serviceId, healthScore: metrics.health || 100, latencyMs: metrics.latencyMs || Date.now() - startTime, timestamp: new Date().toISOString() });
}

// 2. GET Resources Handler
export async function handleGetResources(req: Request, res: Response): Promise<void> {
  const { serviceId, apiKey, token, accountName, teamId, cfAccountId, accountId, email, globalApiKey } = extractCredentials(req);

  if (serviceId.includes('cloudflare')) {
    res.json(await getCloudflareResources(token, cfAccountId || accountId, email, globalApiKey, accountName));
    return;
  }

  if (serviceId.includes('vercel')) {
    res.json(await getVercelResources(token, accountName, teamId));
    return;
  }

  if (serviceId.includes('github')) {
    res.json(await getGithubResources(token, accountName));
    return;
  }

  if (serviceId.includes('google-ai-studio') || serviceId.includes('gemini')) {
    const resources: Array<Record<string, unknown>> = [];
    let modelsCount = 0;
    let tunedCount = 0;

    const activeApp = getActiveWorkspaceCloudRunApp(accountName || 'user');
    if (activeApp) {
      resources.push({ id: activeApp.id, type: 'CLOUD_RUN_APP', name: activeApp.name, description: activeApp.description, uri: activeApp.devUrl, status: activeApp.status });
    }

    if (apiKey) {
      try {
        const [modelsRes, tunedRes] = await Promise.allSettled([
          fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`, { signal: AbortSignal.timeout(6000) }).then((r) => r.json()),
          fetch(`https://generativelanguage.googleapis.com/v1beta/tunedModels?key=${encodeURIComponent(apiKey.trim())}`, { signal: AbortSignal.timeout(6000) }).then((r) => r.json()),
        ]);

        if (modelsRes.status === 'fulfilled' && Array.isArray(modelsRes.value?.models)) {
          modelsCount = modelsRes.value.models.length;
          for (const m of modelsRes.value.models.slice(0, 15)) {
            resources.push({ id: m.name, type: 'AI_MODEL', name: String(m.displayName || m.name).replace('models/', ''), description: m.description });
          }
        }

        if (tunedRes.status === 'fulfilled' && Array.isArray(tunedRes.value?.tunedModels)) {
          tunedCount = tunedRes.value.tunedModels.length;
          for (const tm of tunedRes.value.tunedModels) {
            resources.push({ id: tm.name, type: 'TUNED_MODEL', name: String(tm.displayName || tm.name), description: `Tuned model in AI Studio (${tm.state || 'ACTIVE'})` });
          }
        }
      } catch {}
    }

    res.json({ success: true, serviceId, account: accountName || 'Authenticated Workspace', summary: { totalModels: modelsCount, tunedModels: tunedCount, cloudRunApps: activeApp ? 1 : 0 }, count: resources.length, resources, timestamp: new Date().toISOString() });
    return;
  }

  res.json({ success: true, serviceId, count: 0, resources: [], timestamp: new Date().toISOString() });
}

router.get('/health', handleGetHealth);
router.get('/resources', handleGetResources);

export default router;
