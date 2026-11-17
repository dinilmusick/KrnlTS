/**
 * @file SrklBackend.ts
 * @description Master Frontend-Backend Entrypoint Facade for SRKL.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 4, 9, 10, 28 & Law L7.
 * Re-exports all public services, universal core services, and orchestrations.
 */

import { backblazeService } from './services/backblaze/backblaze';
import { geminiService } from './services/gemini/gemini';
import { githubService } from './services/github/github';
import { vercelService } from './services/vercel/vercel';
import { cloudflareService } from './services/cloudflare/cloudflare';
import { oracleService } from './services/oracle/oracle';
import { authService } from './services/auth/auth';
import { auditService } from './services/audit/audit';

import { queryUnifiedDb } from './services/core/unifiedDb';
import * as authCore from './services/core/authCore';
import * as backblazeCore from './services/core/backblazeCore';
import * as workspaceCore from './services/core/workspaceCore';
import * as ecosystemCore from './services/core/ecosystemCore';

import { serviceSyncOrchestration } from './orchestrations/serviceSyncOrchestration';
import { clusterScanOrchestration } from './orchestrations/clusterScanOrchestration';

import { FodRuntime, createFodServiceFacadeForWorkspace, scanBackendFacadeToNodes } from '@ultrst-armada/kloks/fod';
import { workingWorkspaceService, remoteWorkspaceService } from '@ultrst-armada/kloks/backend/node';
import { guttsFodNodeDefinitions, executeGuttsApi } from '@dinilmusick/gutts/api';
import { createAikoRuntime as buildAikoRuntime, createAikoServiceFacade } from './aikoRuntime';

export const orchestrations = {
  serviceSyncOrchestration,
  clusterScanOrchestration,
};

export const createFodRuntime = (workspaceId: string) => {
  const wsService = remoteWorkspaceService || workingWorkspaceService;
  const runtime = new FodRuntime({ workspaceId, workspaceService: wsService as any });
  const host = scanBackendFacadeToNodes({ services, orchestrations });
  const guttsEndpoints = guttsFodNodeDefinitions.map((node: any) => ({
    id: String(node.metadata.apiId), serviceId: '@dinilmusick/gutts', serviceName: 'GutTS',
    operationId: String(node.metadata.apiId), operationName: node.label, description: node.description,
    invoke: (input: Record<string, unknown>) => executeGuttsApi(String(node.metadata.apiId), input),
  }));
  runtime.setEndpoints([...host.endpoints, ...guttsEndpoints], [...(host.nodes as any), ...(guttsFodNodeDefinitions as any)]);
  return runtime;
};

export const FodServiceFacade = createFodServiceFacadeForWorkspace(createFodRuntime);

async function getKrusblDeploymentUrl(): Promise<string> {
  try {
    const result = await queryUnifiedDb<{ credentials: unknown }>(
      `SELECT credentials FROM public.\"ultrst-credentials\" WHERE id = 'system' LIMIT 1`
    );
    const raw = result.rows[0]?.credentials;
    const credentials = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
    const registry = (credentials as any).applicationDeployments || (credentials as any).deployments || {};
    const entry = registry.krusbl || (credentials as any).krusbl || {};
    let url = String(entry.url || entry.deploymentUrl || entry.endpoint || '').trim();
    while (url.endsWith('/')) url = url.slice(0, -1);
    if (url) return url;
  } catch {}
  return 'https://krusbl-engine.dextro1n1laevo.workers.dev';
}

export const bugReportService = {
  report: async (input: any, options?: any) => {
    const authToken = options?.authToken ?? options?.auth?.token ?? '';
    const authId = options?.session?.userId ?? options?.auth?.user?.id ?? '';
    const baseUrl = await getKrusblDeploymentUrl();
    if (!authId && !authToken) throw new Error('[Skipo:Bug] Authenticated session is required.');
    const response = await fetch(baseUrl.replace(/\/$/, '') + '/api/bugs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + authToken },
      body: JSON.stringify({
        ...input, reporterId: authId,
        context: { applicationId: 'srkl-engine', applicationType: 'skipo' as const, ...input?.context },
      }),
    });
    if (!response.ok) throw new Error('[Skipo:Bug] Krusbl returned HTTP ' + response.status + ': ' + await response.text());
    return response.json();
  },
};

export const createAikoRuntime = (workspaceId: string) => {
  const rt = buildAikoRuntime(workspaceId, {
    fod: createFodRuntime(workspaceId),
    backend: { services, orchestrations },
  }) as any;
  rt.reportBug = (report: any, authToken?: string) => bugReportService.report(report, { authToken });
  return rt;
};

export const AikoServiceFacade = createAikoServiceFacade(createAikoRuntime);

export const services = {
  backblaze: backblazeService,
  gemini: geminiService,
  github: githubService,
  vercel: vercelService,
  cloudflare: cloudflareService,
  oracle: oracleService,
  auth: authService,
  audit: auditService,
  coreDb: { query: queryUnifiedDb },
  coreAuth: authCore,
  coreBackblaze: backblazeCore,
  coreWorkspaces: workspaceCore,
  coreEcosystem: ecosystemCore,
  fod: FodServiceFacade,
  aiko: AikoServiceFacade,
  bugReport: bugReportService,
};

export const SrklBackend = {
  services,
  orchestrations,
  createFodRuntime,
  createAikoRuntime,
  FodServiceFacade,
  AikoServiceFacade,
  bugReportService,
};

export default SrklBackend;
