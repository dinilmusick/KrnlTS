import { telemetry } from './K_LIB_Krnl_Telemetry.js';

export function heartbeatApi(entity: any) {
  return () => ({
    name: entity.entityName,
    type: entity.systemType,
    timestamp: new Date().toISOString()
  });
}

export function telemetryApi(entity: any) {
  return () => ({
    entityName: entity.entityName,
    systemType: entity.systemType,
    flags: (entity as any).getSystemFlags(),
    owner: (entity as any).hierarchyManager.getOwnerEntity()?.entityName || null,
    ownedEntities: (entity as any).hierarchyManager.getAllOwnedComponentEntities().map((e: any) => e.entityName),
    activeRoutes: (entity as any).commComponent.listRoutes(),
    uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : null,
    performance: telemetry.getSummary()
  });
}

export function adminCommandApi(entity: any) {
  return async ({ command, args }: { command: string, args: any }) => {
    console.log(`[${entity.entityName}] Admin command: ${command}`, args);
    if (command === 'set-discoverable') {
      return {
        status: 'acknowledged',
        command,
        flags: (entity as any).setDiscoverable(Boolean(args?.value)),
      };
    }
    if (command === 'reserve') {
      return {
        status: 'acknowledged',
        command,
        flags: (entity as any).reserveFor(args?.serviceName || 'unknown'),
      };
    }
    if (command === 'release-reservation') {
      return {
        status: 'acknowledged',
        command,
        flags: (entity as any).releaseReservation(args?.serviceName || null),
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
    return { status: 'acknowledged', command, flags: (entity as any).getSystemFlags() };
  };
}

export function discoverPeersApi(entity: any) {
  return ({ includeBusy = true } = {}) => {
    const peers = (entity as any).listPeers();
    if (includeBusy) return peers;
    return peers.filter((peer: any) => !peer.busy);
  };
}

export function getManifestApi(entity: any) {
  return () => (entity as any).getManifest();
}

export function getLastActionDocsApi(entity: any) {
  return () => {
    return {
      preemptiveDocumentation: entity._lastPreemptiveDoc || null,
      errorDocumentation: entity._lastErrorDoc || null
    };
  };
}

export function getFullDocumentationApi(entity: any) {
  return () => {
    if (entity._documentationProvider && typeof entity._documentationProvider.getDocsForLayer === 'function') {
      // Return everything from LAYER_1_ENTRY as a starting point, or maybe a dedicated "FULL" call if it exists
      return entity._documentationProvider.getDocsForLayer("LAYER_1_ENTRY") || [];
    }
    return [];
  };
}

export function systemCommandsCollectorHandler(entity: any) {
  return (msg: any) => {
    console.log(`[${entity.entityName}] system-commands received:`, JSON.stringify(msg.data));
  };
}
