import { telemetry } from './K_LIB_Krnl_Telemetry.js';

export function heartbeatApi(entity) {
  return () => ({
    name: entity.entityName,
    type: entity.systemType,
    timestamp: new Date().toISOString()
  });
}

export function telemetryApi(entity) {
  return () => ({
    entityName: entity.entityName,
    systemType: entity.systemType,
    flags: entity.getSystemFlags(),
    owner: entity.hierarchyManager.getOwnerEntity()?.entityName || null,
    ownedEntities: entity.hierarchyManager.getAllOwnedComponentEntities().map((e) => e.entityName),
    activeRoutes: entity.commComponent.listRoutes(),
    uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : null,
    performance: telemetry.getSummary()
  });
}

export function adminCommandApi(entity) {
  return async ({ command, args }) => {
    console.log(`[${entity.entityName}] Admin command: ${command}`, args);
    if (command === 'set-discoverable') {
      return {
        status: 'acknowledged',
        command,
        flags: entity.setDiscoverable(Boolean(args?.value)),
      };
    }
    if (command === 'reserve') {
      return {
        status: 'acknowledged',
        command,
        flags: entity.reserveFor(args?.serviceName || 'unknown'),
      };
    }
    if (command === 'release-reservation') {
      return {
        status: 'acknowledged',
        command,
        flags: entity.releaseReservation(args?.serviceName || null),
      };
    }
    if (command === 'shutdown') {
      console.log(`[${entity.entityName}] Graceful shutdown initiated via admin command.`);
      setTimeout(() => {
        entity.dispose();
        process.exit(0);
      }, 500);
      return {
        status: 'acknowledged',
        command,
        message: 'System will shutdown in 500ms'
      };
    }
    return { status: 'acknowledged', command, flags: entity.getSystemFlags() };
  };
}

export function discoverPeersApi(entity) {
  return ({ includeBusy = true } = {}) => {
    const peers = entity.listPeers();
    if (includeBusy) return peers;
    return peers.filter((peer) => !peer.busy);
  };
}

export function manifestApi(entity) {
  return () => entity.getManifest();
}

export function systemCommandsCollectorHandler(entity) {
  return (msg) => {
    console.log(`[${entity.entityName}] system-commands received:`, JSON.stringify(msg.data));
  };
}
