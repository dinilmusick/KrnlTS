import { describe, expect, it } from 'vitest';
import { createKoneTransport } from './transport.js';
import { createKoneOscRouter, type KoneOscDevice } from './osc.js';

describe('Kone transport and OSC boundary', () => {
  it('uses Kloks Clock as the sole timebase and exposes execution signals', () => {
    const transport = createKoneTransport({ tempo: 120, timeSignature: [4, 4], resolution: 24 });
    expect(transport.getState().beat).toBe(0);
    transport.dispatch('play');
    expect(transport.getState().transport).toBe('running');
    transport.dispatch('pause');
    expect(transport.getState().transport).toBe('paused');
    transport.dispatch('stop');
    expect(transport.getState().transport).toBe('stopped');
    transport.dispatch('reset');
    expect(transport.getState().beat).toBe(0);
    transport.dispose();
  });
  it('maps semantic OSC routes to the canonical Kloks OSC service', async () => {
    const sent: Uint8Array[] = [];
    const transport = {
      send: async (_endpoint: KoneOscDevice['endpoint'], packet: Uint8Array) => { sent.push(packet); },
      listen: async () => async () => {},
    };
    const router = createKoneOscRouter(transport);
    const device: KoneOscDevice = { id: 'osc-1', name: 'Studio OSC', endpoint: { id: 'osc-1', host: '127.0.0.1', port: 9000, transport: 'udp' } };
    router.addDevice(device);
    router.addRoute({ id: 'route-1', name: 'Filter Cutoff', deviceId: device.id, address: '/filter/cutoff', direction: 'send' });
    const result = await router.send('route-1', { address: '/filter/cutoff', args: [0.5] });
    expect(result.ok).toBe(true);
    expect(sent).toHaveLength(1);
    await router.dispose();
  });
});
