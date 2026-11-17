import type { CapabilityExecutor, ExternalCapabilityContext } from './contract.js';
import type { IBackendFacade } from '../BackendFacadeTypes.js';

export function createBackendCapabilityExecutor(backend: IBackendFacade): CapabilityExecutor {
  return {
    execute(serviceId, operationId, input, context: ExternalCapabilityContext) {
      const principal = context.principal && 'userId' in context.principal
        ? {
            kind: 'authenticated' as const,
            userId: context.principal.userId,
            roles: [...(context.principal.roles ?? [])],
            sessionId: context.principal.sessionId,
          }
        : null;
      return backend.executeCapability(serviceId, operationId, input, {
        serviceId,
        correlationId: context.requestId,
        metadata: {
          externalInterface: true,
          transport: context.transport,
          principal,
        },
      });
    },
  };
}
