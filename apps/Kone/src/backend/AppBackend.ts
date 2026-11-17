// ══════════════════════════════════════════════════════════════════════════════
// 1. MINIMAL BACKEND FACADE (@ultrst-armada/kloks/* & @ultrst-armada/krnl COMPOSITION)
// ══════════════════════════════════════════════════════════════════════════════

import { ServiceAFacade, ServiceBFacade } from '@ultrst-armada/kloks/services';
import { OrchestratorADefinition, AudioMidiOrchestratorDefinition } from '@ultrst-armada/kloks/orchestrations';
import { AudioHardwareServiceFacade, MidiServiceFacade } from '@ultrst-armada/kloks/audio-midi';
import {
  StorageServiceFacade,
  WorkspaceServiceFacade,
} from '@ultrst-armada/kloks/backend/krnl-services';
import { workingWorkspaceService } from '@ultrst-armada/kloks/backend/node';
import { WorkerExecutionBoundary } from '@ultrst-armada/krnl';
import { FodRuntime, createFodServiceFacadeForWorkspace, scanBackendFacadeToNodes } from '@ultrst-armada/kloks/fod';
import { guttsFodNodeDefinitions, executeGuttsApi } from '@dinilmusick/gutts/api';
import { createAikoRuntime as buildAikoRuntime, createAikoServiceFacade } from './aikoRuntime.js';

export const orchestrations = {
  orchestratorA: OrchestratorADefinition,
  audioMidi: AudioMidiOrchestratorDefinition,
};

export const appWorkerBoundary = new WorkerExecutionBoundary('app_worker_main');

export const createFodRuntime = (workspaceId: string) => {
  const runtime = new FodRuntime({ workspaceId, workspaceService: workingWorkspaceService });
  const host = scanBackendFacadeToNodes({ services, orchestrations });
  const guttsEndpoints = guttsFodNodeDefinitions.map((node: any) => ({
    id: String(node.metadata.apiId), serviceId: '@dinilmusick/gutts', serviceName: 'GutTS',
    operationId: String(node.metadata.apiId), operationName: node.label, description: node.description,
    invoke: (input: Record<string, unknown>) => executeGuttsApi(String(node.metadata.apiId), input),
  }));
  runtime.setEndpoints([...host.endpoints, ...guttsEndpoints], [...host.nodes as any, ...guttsFodNodeDefinitions as any]);
  return runtime;
};

export const FodServiceFacade = createFodServiceFacadeForWorkspace(createFodRuntime);

export const bugReportService = {
  report: async (input: any, options?: any) => {
    const authToken = options?.authToken ?? options?.auth?.token ?? '';
    const authId = options?.session?.userId ?? options?.auth?.user?.id ?? '';
    const baseUrl = 'https://krusbl-engine.dextro1n1laevo.workers.dev';
    if (!authId && !authToken) throw new Error('[Skipo:Bug] Authenticated session is required.');
    const response = await fetch(baseUrl.replace(/\/$/, '') + '/api/bugs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + authToken,
      },
      body: JSON.stringify({
        ...input,
        reporterId: authId,
        context: {
          applicationId: 'kone',
          applicationType: 'skipo' as const,
          ...input?.context,
        },
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
  serviceA: ServiceAFacade,
  serviceB: ServiceBFacade,
  audioHardware: AudioHardwareServiceFacade,
  midi: MidiServiceFacade,
  storage: StorageServiceFacade,
  workspace: WorkspaceServiceFacade,
  fod: FodServiceFacade,
  aiko: AikoServiceFacade,
  bugReport: bugReportService,
};

export const AppBackend = {
  services,
  orchestrations,
  worker: appWorkerBoundary,
  WorkerExecutionBoundary: appWorkerBoundary,
};

export default AppBackend;
