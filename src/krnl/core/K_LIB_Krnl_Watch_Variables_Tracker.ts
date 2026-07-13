import { KrnlAiEndpointConfig } from "./K_LIB_Krnl_Ai_Concepts.js";

export class KrnlWatchVariablesTracker {
  private registeredFunctionalities: Map<string, any> = new Map();
  private endpointConfigs: Map<string, KrnlAiEndpointConfig> = new Map();

  register(
    functionalityId: string,
    config: KrnlAiEndpointConfig,
    functionality: any
  ): void {
    this.registeredFunctionalities.set(functionalityId, functionality);
    this.endpointConfigs.set(functionalityId, config);
  }

  readLiveVars(endpointId: string): Record<string, any> {
    const config = this.endpointConfigs.get(endpointId);
    const functionality = this.registeredFunctionalities.get(endpointId);
    if (!config || !functionality) return {};

    const liveVars: Record<string, any> = {};
    const keysToRead = [
      ...(config.staticWatchVars || []),
      ...(config.dynamicWatchVars || [])
    ];

    const state = functionality.state || {};
    for (const key of keysToRead) {
      if (key in state) {
        liveVars[key] = state[key];
      }
    }
    return liveVars;
  }

  sharedDynamicVars(endpointA: string, endpointB: string): string[] {
    const configA = this.endpointConfigs.get(endpointA);
    const configB = this.endpointConfigs.get(endpointB);
    if (!configA || !configB) return [];

    const dynA = configA.dynamicWatchVars || [];
    const dynB = configB.dynamicWatchVars || [];

    return dynA.filter(v => dynB.includes(v));
  }

  endpointsForVar(varKey: string): string[] {
    const matched: string[] = [];
    for (const [fid, config] of this.endpointConfigs.entries()) {
      if (config.dynamicWatchVars?.includes(varKey)) {
        matched.push(fid);
      }
    }
    return matched;
  }
}
