import { BackendFacade } from './BackendFacade.js';
import { ServiceAFacade, ServiceBFacade } from '@ultrst-armada/kloks/services';
import { createAppExternalInterfaces } from './externalInterfaces.js';
import { LuthAuthServiceFacade } from './LuthAuthServiceFacade.js';

export const backendFacade = new BackendFacade();
backendFacade.registerService(ServiceAFacade);
backendFacade.registerService(ServiceBFacade);

export const services = {
  auth: LuthAuthServiceFacade,
  serviceA: ServiceAFacade,
  serviceB: ServiceBFacade,
};

export const externalInterfaces = createAppExternalInterfaces(backendFacade);

export const AppBackend = {
  services,
  backendFacade,
  externalInterfaces,
};

export default AppBackend;
