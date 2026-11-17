import { backendFacade, type BackendFacade } from './BackendFacade.js';
import { CapabilityRegistry } from './external/registry.js';
import { createBackendCapabilityExecutor } from './external/backendExecutor.js';
import { createExternalHttpHandler } from './external/httpAdapter.js';
import { createMcpHandler } from './external/mcpAdapter.js';
import { getLuthSession } from './auth/luthSession.js';

export function createAppExternalInterfaces(backend: BackendFacade = backendFacade) {
  const registry = new CapabilityRegistry(createBackendCapabilityExecutor(backend));
  for (const capability of backend.listCapabilities()) {
    registry.register({
      id: capability.id,
      description: capability.description || capability.name,
      inputSchema: capability.inputSchema ?? { type: 'object', additionalProperties: true },
      outputSchema: capability.outputSchema ?? { type: 'object', additionalProperties: true },
      invocation: { serviceId: capability.serviceId, operationId: capability.invocation.operation },
      access: 'authenticated',
      discoverable: true,
    });
  }
  const authenticate = async (request: Request) => {
    const session = await getLuthSession(request);
    if (!session?.user?.id) return null;
    return {
      userId: String(session.user.id),
      sessionId: String(session.session?.id ?? ''),
      roles: Array.isArray(session.user.roles) ? session.user.roles.map(String) : [],
    };
  };
  return {
    registry,
    http: createExternalHttpHandler({ registry, authenticate }),
    mcp: createMcpHandler({ registry, authenticate }),
  };
}

export const externalInterfaces = createAppExternalInterfaces();
