/**
 * @file googleAiStudio.ts
 * @description Google AI Studio developing apps catalog & live API verification engine.
 * Zero-mock policy: never seeds placeholder applets. Only user-tracked or live API data.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import { broadcastTelemetry } from '../telemetryBus';
import { addAuditLog } from '../audit';
import { AiStudioApp, formatTunedModelApp } from './googleAiStudioCatalog';
import { queryCloudRunServices, getActiveWorkspaceCloudRunApp } from '../cloudRunScanner';

const router = express.Router();
const appsStore = new Map<string, AiStudioApp>();

function getAppsForAccount(account: string): AiStudioApp[] {
  const normEmail = account.trim().toLowerCase();
  if (!normEmail) return [];
  return Array.from(appsStore.values()).filter(
    (a) => a.googleAccount.toLowerCase() === normEmail || normEmail.includes(a.googleAccount.toLowerCase())
  );
}

// 1. Live Verification of Google AI Studio Credentials
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  const { googleAccount, apiKey, projectId, accessToken } = req.body;
  if (!googleAccount?.includes?.('@')) {
    res.status(400).json({ success: false, error: 'Google Account email is MANDATORY (e.g. developer@gmail.com).' });
    return;
  }
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    res.status(400).json({ success: false, error: 'Google AI Studio API Key is MANDATORY.' });
    return;
  }
  if (!projectId?.trim()) {
    res.status(400).json({ success: false, error: 'Google Cloud Project ID is MANDATORY.' });
    return;
  }
  if (!accessToken?.trim()) {
    res.status(400).json({ success: false, error: 'OAuth 2.0 Access Token is MANDATORY.' });
    return;
  }

  try {
    const googleRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`,
      { signal: AbortSignal.timeout(9000) }
    );
    const data = await googleRes.json();
    if (!googleRes.ok) {
      res.status(400).json({ success: false, error: `Google AI Studio verification failed: ${data.error?.message || googleRes.status}` });
      return;
    }
    const models = Array.isArray(data.models) ? data.models : [];
    await addAuditLog('AI_STUDIO_CREDENTIALS_VERIFIED', googleAccount, `Verified API key (${models.length} models)`, 'ai_studio');
    res.json({
      success: true,
      verified: true,
      googleAccount: googleAccount.trim(),
      projectId: projectId.trim(),
      modelsCount: models.length,
      sampleModels: models.slice(0, 4).map((m: any) => String(m.name || '').replace('models/', '')),
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(502).json({ success: false, error: `Connection failed: ${err instanceof Error ? err.message : String(err)}` });
  }
});

// 2. Scan & Enumerate Live Fine-Tuned Models & Cloud Run Applets
router.post('/scan', async (req: Request, res: Response): Promise<void> => {
  const { googleAccount, apiKey, projectId, token, accessToken } = req.body;
  const targetEmail = String(googleAccount || '').trim().toLowerCase();
  if (!targetEmail || !apiKey || apiKey.trim().length < 8) {
    res.status(400).json({ success: false, error: 'Valid Google Account email and API Key required.' });
    return;
  }

  const cloudRunResult = await queryCloudRunServices({
    projectId: (projectId as string) || '207414612407',
    token: (token || accessToken) as string,
    apiKey,
    googleAccount: targetEmail,
  });
  for (const crApp of cloudRunResult.apps) appsStore.set(crApp.id, crApp);

  const activeApp = getActiveWorkspaceCloudRunApp(targetEmail, (projectId as string) || '207414612407');
  if (activeApp) appsStore.set(activeApp.id, activeApp);

  let tunedFound = 0;
  try {
    const tunedRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/tunedModels?key=${encodeURIComponent(apiKey.trim())}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (tunedRes.ok) {
      const tunedData = await tunedRes.json();
      if (Array.isArray(tunedData.tunedModels)) {
        for (const tm of tunedData.tunedModels) {
          const formatted = formatTunedModelApp(tm, targetEmail, (projectId as string) || '');
          appsStore.set(formatted.id, formatted);
          tunedFound++;
        }
      }
    }
  } catch {}

  const apps = getAppsForAccount(targetEmail);
  res.json({ success: true, count: apps.length, tunedModelsFound: tunedFound, cloudRun: cloudRunResult, apps });
});

// 3. List Developing Apps
router.get('/apps', async (req: Request, res: Response): Promise<void> => {
  const { account, googleAccount, apiKey, projectId } = req.query;
  const targetEmail = ((account || googleAccount) as string)?.trim().toLowerCase();

  if (!targetEmail) {
    const allApps = Array.from(appsStore.values());
    res.json({ success: true, total: allApps.length, account: 'all', apps: allApps });
    return;
  }

  const activeApp = getActiveWorkspaceCloudRunApp(targetEmail, (projectId as string) || '207414612407');
  if (activeApp) appsStore.set(activeApp.id, activeApp);

  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length >= 8) {
    try {
      const tunedRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/tunedModels?key=${encodeURIComponent(apiKey.trim())}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (tunedRes.ok) {
        const tunedData = await tunedRes.json();
        if (Array.isArray(tunedData.tunedModels)) {
          for (const tm of tunedData.tunedModels) {
            appsStore.set(tm.name, formatTunedModelApp(tm, targetEmail, (projectId as string) || ''));
          }
        }
      }
    } catch {}
  }

  const apps = getAppsForAccount(targetEmail);
  res.json({ success: true, total: apps.length, account: targetEmail, apps });
});

// 4. Register or Track New Developing Applet
router.post('/apps', async (req: Request, res: Response): Promise<void> => {
  const { name, description, googleAccount, appletId, platform, devUrl, shareUrl, model, projectId } = req.body;
  if (!name || !googleAccount) {
    res.status(400).json({ success: false, error: 'App name and googleAccount are required' });
    return;
  }

  const id = `applet-${Date.now().toString(36)}`;
  const newApp: AiStudioApp = {
    id,
    name: String(name),
    description: String(description || 'Google AI Studio Developing Application'),
    googleAccount: String(googleAccount).trim().toLowerCase(),
    appletId: String(appletId || id),
    platform: platform || 'Web (React + Vite)',
    status: 'DEVELOPMENT',
    model: String(model || 'Gemini 2.5 Flash'),
    projectId: String(projectId || ''),
    devUrl: String(devUrl || ''),
    shareUrl: String(shareUrl || ''),
    updatedAt: new Date().toISOString(),
  };

  appsStore.set(id, newApp);
  await addAuditLog('AI_STUDIO_APPLET_TRACKED', newApp.googleAccount, `Tracked applet: ${newApp.name}`, 'ai_studio');
  broadcastTelemetry({ type: 'STATUS_SYNC', timestamp: new Date().toISOString(), payload: { appletId: id } });
  res.json({ success: true, app: newApp });
});

// 5. Delete Tracked Applet
router.delete('/apps/:id', (req: Request, res: Response): void => {
  const existed = appsStore.delete(req.params.id);
  res.json({ success: true, deleted: existed });
});

export default router;
