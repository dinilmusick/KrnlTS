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

// ── Port Registry APIs ─────────────────────────────────────────────────────

/**
 * getUsedPortsApi
 *
 * Returns every port registered on this system entity.
 * P_local ⊆ ℕ  is the image of the portRegistry map.
 *
 * Response: { entity, ports: number[], registry: Record<string, number> }
 */
export function getUsedPortsApi(entity: any) {
  return () => {
    const registry: Record<string, number> = (entity as any).getRegisteredPorts();
    return {
      entity: entity.entityName,
      ports: Object.values(registry) as number[],
      registry,
    };
  };
}

/**
 * findFreePortsApi
 *
 * Queries every known peer for its port set, unions them with the local set,
 * then returns the k smallest ports in [rangeStart, rangeEnd] not in the union.
 *
 *   U      = ⋃_{i=0}^{N} P_i        (union across N peers + self)
 *   F      = { p ∈ [rangeStart, rangeEnd] | p ∉ U }
 *   result = min_k(F)                (k smallest free ports)
 *
 * Input:  { count, rangeStart?, rangeEnd? }
 * Output: { freePorts, queriedPeers, totalUsedCount, usedByPeer }
 */
export function findFreePortsApi(entity: any) {
  return async ({
    count = 1,
    rangeStart = 3000,
    rangeEnd = 65535,
  }: {
    count?: number;
    rangeStart?: number;
    rangeEnd?: number;
  }) => {
    if (count < 1) throw new Error('count must be ≥ 1');
    if (rangeStart < 1 || rangeEnd > 65535 || rangeStart > rangeEnd) {
      throw new Error('Invalid port range: 1 ≤ rangeStart ≤ rangeEnd ≤ 65535');
    }

    // Own port set — P_self
    const usedSet = new Set<number>(
      Object.values((entity as any).getRegisteredPorts()) as number[]
    );
    const usedByPeer: Record<string, number[]> = {
      [entity.entityName]: Array.from(usedSet),
    };

    // Query each live peer — best-effort; unreachable peers are skipped
    const peers: any[] = (entity as any).listPeers();
    await Promise.allSettled(
      peers.map(async (peer: any) => {
        try {
          const remote = (entity as any).getRemoteEntity(peer.id);
          if (!remote) return;
          const result = await remote.call('getUsedPorts', {});
          const payload = result?.payload ?? result;
          const peerPorts: number[] = Array.isArray(payload?.ports) ? payload.ports : [];
          usedByPeer[peer.id] = peerPorts;
          peerPorts.forEach((p: number) => usedSet.add(p));
        } catch (_) { /* peer unreachable — skip */ }
      })
    );

    // F = [rangeStart, rangeEnd] \ U  →  take first k
    const freePorts: number[] = [];
    for (let p = rangeStart; p <= rangeEnd && freePorts.length < count; p++) {
      if (!usedSet.has(p)) freePorts.push(p);
    }

    if (freePorts.length < count) {
      throw new Error(
        `Only ${freePorts.length} free port(s) available in ` +
        `[${rangeStart}, ${rangeEnd}]; requested ${count}.`
      );
    }

    return { freePorts, queriedPeers: peers.length, totalUsedCount: usedSet.size, usedByPeer };
  };
}
