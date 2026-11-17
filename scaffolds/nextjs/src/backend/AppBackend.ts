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
    const authId = options?.session?.userId ?? options?.auth?.user?.id;
    return { success: true, report: input, reporterId: authId };
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
