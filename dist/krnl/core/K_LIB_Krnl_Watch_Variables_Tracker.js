export class KrnlWatchVariablesTracker {
    registeredFunctionalities = new Map();
    endpointConfigs = new Map();
    register(functionalityId, config, functionality) {
        this.registeredFunctionalities.set(functionalityId, functionality);
        this.endpointConfigs.set(functionalityId, config);
    }
    readLiveVars(endpointId) {
        const config = this.endpointConfigs.get(endpointId);
        const functionality = this.registeredFunctionalities.get(endpointId);
        if (!config || !functionality)
            return {};
        const liveVars = {};
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
    sharedDynamicVars(endpointA, endpointB) {
        const configA = this.endpointConfigs.get(endpointA);
        const configB = this.endpointConfigs.get(endpointB);
        if (!configA || !configB)
            return [];
        const dynA = configA.dynamicWatchVars || [];
        const dynB = configB.dynamicWatchVars || [];
        return dynA.filter(v => dynB.includes(v));
    }
    endpointsForVar(varKey) {
        const matched = [];
        for (const [fid, config] of this.endpointConfigs.entries()) {
            if (config.dynamicWatchVars?.includes(varKey)) {
                matched.push(fid);
            }
        }
        return matched;
    }
}
//# sourceMappingURL=K_LIB_Krnl_Watch_Variables_Tracker.js.map