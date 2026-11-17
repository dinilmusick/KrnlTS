import { createService, createServiceDefinition, type IService } from '@ultrst-armada/krnl';
import { OscService, type OscEndpoint } from './service.js';
import type { OscMessage } from './codec.js';
import type { OscTransport } from './service.js';
export interface OscState extends Record<string, unknown> { clients: OscEndpoint[]; servers: OscEndpoint[]; lastMessage: OscMessage | null; }
export function createOscKernelService(transport: OscTransport): IService<OscState> {
  const osc = new OscService(transport);
  let service: IService<OscState>;
  let stopMessages: (() => void) | undefined;
  const definition = createServiceDefinition<OscState>({
    id: 'kloks.osc', name: 'OscService', version: '1.0.0',
    state: { initial: { clients: [], servers: [], lastMessage: null } },
    lifecycle: {
      onInit: () => { stopMessages = osc.subscribe('/**', message => service.setState({ lastMessage: message })); },
      onStop: async () => { await Promise.all(osc.getServers().filter(server => server.state === 'listening').map(server => osc.stopServer(server.id))); service.setState({ servers: osc.getServers() }); },
      onDispose: async () => { stopMessages?.(); await osc.dispose(); },
    },
    operations: {
      addClient: { id: 'OscService.addClient', name: 'addClient', handler: async (input: OscEndpoint) => { osc.addClient(input); service.setState({ clients: osc.getClients() }); return osc.getClients(); } },
      startServer: { id: 'OscService.startServer', name: 'startServer', handler: async (input: OscEndpoint) => { await osc.startServer(input); service.setState({ servers: osc.getServers() }); return osc.getServers(); } },
      stopServer: { id: 'OscService.stopServer', name: 'stopServer', handler: async (input: { id: string }) => { await osc.stopServer(input.id); service.setState({ servers: osc.getServers() }); return osc.getServers(); } },
      send: { id: 'OscService.send', name: 'send', handler: async (input: { clientId: string; message: OscMessage }) => osc.send(input.clientId, input.message) },
      getState: { id: 'OscService.getState', name: 'getState', handler: async () => ({ clients: osc.getClients(), servers: osc.getServers() }) },
    },
  });
  service = createService(definition);
  return service;
}
