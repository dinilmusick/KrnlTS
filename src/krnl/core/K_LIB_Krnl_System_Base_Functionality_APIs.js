//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_System_Base_Functionality_APIs.js
 * @description Reusable API atoms for krnlSystemEntityBase default functionalities.
 */

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
