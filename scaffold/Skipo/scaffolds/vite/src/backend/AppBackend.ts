// ══════════════════════════════════════════════════════════════════════════════
// 1. MINIMAL BACKEND FACADE (@ultrst-armada/kloks/* & @ultrst-armada/krnl COMPOSITION)
// ══════════════════════════════════════════════════════════════════════════════

import { ServiceAFacade, ServiceBFacade } from '@ultrst-armada/kloks/services';
import { OrchestratorADefinition } from '@ultrst-armada/kloks/orchestrations';
import {
  StorageServiceFacade,
  WorkspaceServiceFacade,
} from '@ultrst-armada/kloks/backend/krnl-services';
import { WorkerExecutionBoundary } from '@ultrst-armada/krnl';
import { createGoogleDriveWorkspaceStorage } from './storage/googleDriveWorkspaceStorage.js';
import { LuthAuthServiceFacade } from './LuthAuthServiceFacade.js';
import { BackendFacade } from './BackendFacade.js';
import { createAppExternalInterfaces } from './externalInterfaces.js';

export const orchestrations = {
  orchestratorA: OrchestratorADefinition,
};

export const appWorkerBoundary = new WorkerExecutionBoundary('app_worker_main');

export const bugReportService = {
  report: async (input: any, options?: any) => {
    const authToken = options?.authToken ?? options?.auth?.token ?? '';
    const authId = options?.session?.userId ?? options?.auth?.user?.id ?? '';
    const environment = options?.env ?? {};\n    const baseUrl = String(environment.KRUSBL_URL ?? '');
    if (!baseUrl) throw new Error('[Skipo:Bug] KRUSBL_URL is required.');
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
          applicationId: environment.APPLICATION_ID || 'skipo-app',
          applicationType: 'skipo' as const,
          applicationVersion: environment.APPLICATION_VERSION,
          deploymentId: environment.DEPLOYMENT_ID,
          sourceRevision: environment.SOURCE_REVISION,
          ...input?.context,
        },
      }),
    });
    if (!response.ok) throw new Error('[Skipo:Bug] Krusbl returned HTTP ' + response.status + ': ' + await response.text());
    return response.json();
  },
};

export const services = {
  auth: LuthAuthServiceFacade,
  serviceA: ServiceAFacade,
  serviceB: ServiceBFacade,
  storage: StorageServiceFacade,
  workspace: WorkspaceServiceFacade,
  bugReport: bugReportService,
};

export const backendFacade = new BackendFacade();
for (const service of [ServiceAFacade, ServiceBFacade, StorageServiceFacade, WorkspaceServiceFacade]) backendFacade.registerService(service);
export const externalInterfaces = createAppExternalInterfaces(backendFacade);

export const storageProviders = {
  googleDrive: { create: createGoogleDriveWorkspaceStorage },
};

export const AppBackend = {
  services,
  storageProviders,
  orchestrations,
  worker: appWorkerBoundary,
  WorkerExecutionBoundary: appWorkerBoundary,
  backendFacade,
  externalInterfaces,
};

export default AppBackend;
