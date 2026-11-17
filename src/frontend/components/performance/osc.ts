import {
  OscService,
  type OscEndpoint,
  type OscListener,
  type OscMessage,
  type OscPacket,
  type OscTransport,
} from '@ultrst-armada/kloks/osc';

export type KoneOscRouteDirection = 'send' | 'receive' | 'bidirectional';

export interface KoneOscDevice {
  id: string;
  name: string;
  endpoint: OscEndpoint;
}

export interface KoneOscRoute {
  id: string;
  name: string;
  deviceId: string;
  address: string;
  direction: KoneOscRouteDirection;
  description?: string;
}

export interface KoneOscSendResult {
  routeId: string;
  ok: true;
  message: OscMessage;
}

export interface KoneOscReceiveEvent {
  routeId: string;
  deviceId: string;
  address: string;
  message: OscMessage;
}

export interface KoneOscRouter {
  addDevice(device: KoneOscDevice): void;
  addRoute(route: KoneOscRoute): void;
  getDevices(): KoneOscDevice[];
  getRoutes(): KoneOscRoute[];
  start(): Promise<void>;
  send(routeId: string, message: OscMessage): Promise<KoneOscSendResult>;
  subscribe(routeId: string, listener: (event: KoneOscReceiveEvent) => void): () => void;
  dispose(): Promise<void>;
}

export function createKoneOscRouter(transport: OscTransport): KoneOscRouter {
  const service = new OscService(transport);
  const devices = new Map<string, KoneOscDevice>();
  const routes = new Map<string, KoneOscRoute>();
  const subscriptions = new Map<string, Set<(event: KoneOscReceiveEvent) => void>>();

  const routeFor = (routeId: string) => {
    const route = routes.get(routeId);
    if (!route) throw new Error(`Unknown OSC route: ${routeId}`);
    return route;
  };

  const deviceFor = (deviceId: string) => {
    const device = devices.get(deviceId);
    if (!device) throw new Error(`Unknown OSC device: ${deviceId}`);
    return device;
  };

  const emit = (route: KoneOscRoute, deviceId: string, message: OscMessage) => {
    const event: KoneOscReceiveEvent = {
      routeId: route.id,
      deviceId,
      address: message.address,
      message,
    };
    subscriptions.get(route.id)?.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Isolate route subscribers from OSC reception.
      }
    });
  };

  const receiveUnsubscribers: Array<() => void> = [];

  return {
    addDevice: (device) => {
      devices.set(device.id, device);
      service.addClient(device.endpoint);
    },
    addRoute: (route) => {
      if (!route.address.startsWith('/')) throw new TypeError('OSC route address must begin with /');
      if (!devices.has(route.deviceId)) throw new Error(`Unknown OSC device: ${route.deviceId}`);
      routes.set(route.id, route);
      if (route.direction === 'receive' || route.direction === 'bidirectional') {
        const unsubscribe = service.subscribe(route.address, (message, endpointId) => emit(route, endpointId, message));
        receiveUnsubscribers.push(unsubscribe);
      }
    },
    getDevices: () => [...devices.values()],
    getRoutes: () => [...routes.values()],
    start: async () => {
      const receiveDevices = new Set(
        [...routes.values()]
          .filter((route) => route.direction === 'receive' || route.direction === 'bidirectional')
          .map((route) => route.deviceId),
      );
      for (const deviceId of receiveDevices) await service.startServer(deviceFor(deviceId).endpoint);
    },
    send: async (routeId, message) => {
      const route = routeFor(routeId);
      if (route.direction === 'receive') throw new Error(`OSC route ${routeId} is receive-only`);
      const device = deviceFor(route.deviceId);
      await service.send(device.id, message);
      return { routeId, ok: true, message };
    },
    subscribe: (routeId, listener) => {
      routeFor(routeId);
      const listeners = subscriptions.get(routeId) ?? new Set();
      listeners.add(listener);
      subscriptions.set(routeId, listeners);
      return () => {
        listeners.delete(listener);
        if (!listeners.size) subscriptions.delete(routeId);
      };
    },
    dispose: async () => {
      receiveUnsubscribers.forEach((unsubscribe) => unsubscribe());
      receiveUnsubscribers.length = 0;
      subscriptions.clear();
      routes.clear();
      devices.clear();
      await service.dispose();
    },
  };
}

export type { OscEndpoint, OscListener, OscMessage, OscPacket, OscTransport };
