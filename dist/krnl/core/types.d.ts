import { z } from "zod";
export interface KrnlFunctionality<I = any, O = any> {
    id: string;
    api: (input: I, context: {
        entity: any;
        state: any;
    }) => Promise<O>;
    schema?: z.ZodType<I>;
    visibility?: "public" | "private" | "protected";
    description?: string;
    example?: any;
}
export interface KrnlPeer {
    id: string;
    address: string;
    lastSeen: number;
    tags?: string[];
    capabilities?: string[];
}
export interface TelemetrySnapshot {
    calls: number;
    errors: number;
    avgLatencyMs: number;
    peakLatencyMs: number;
    avgMemoryDelta: number;
}
/**
 * DefaultConnectionBehaviour
 * Governs treatment of ports not listed in allow / allow_with_key / forbid.
 *
 *   allow_unlisted    → unlisted ports pass through   (open endpoints)
 *   ask_key_unlisted  → unlisted ports must supply key (keyed external endpoints)
 *   forbid_unlisted   → unlisted ports are rejected    (internal endpoints)
 */
export type DefaultConnectionBehaviour = 'allow_unlisted' | 'ask_key_unlisted' | 'forbid_unlisted';
/**
 * KrnlEndpointAccessPolicy
 *
 * Port-based access control attached to any krnlLocalFunctionality.
 *
 *   P_allow   = allow          — unconditional access
 *   P_key     = allow_with_key — access conditional on valid key
 *   P_forbid  = forbid         — hard block
 *
 * Decision function:
 *   f(p, k) = FORBID  if p ∈ P_forbid
 *             PASS    if p ∈ P_allow
 *             KEY(k)  if p ∈ P_key
 *             default_connection_behaviour(p, k)   otherwise
 */
export interface KrnlEndpointAccessPolicy {
    allow: number[];
    allow_with_key: number[];
    forbid: number[];
    default_connection_behaviour: DefaultConnectionBehaviour;
}
/**
 * EndpointCategory — semantic labels for pre-configured access policies.
 *
 *   internal_endpoint          → allow = [registered service ports], default = forbid_unlisted
 *   external_endpoint / free   → default = allow_unlisted
 *   external_endpoint / keyed  → default = ask_key_unlisted  (requires accessKey)
 */
export type EndpointCategory = {
    kind: 'internal_endpoint';
} | {
    kind: 'external_endpoint';
    access: 'free' | 'keyed';
    accessKey?: string;
};
/**
 * KrnlManagedServiceConfig
 * Configuration for an external process (micro-server) managed by the system.
 */
export interface KrnlManagedServiceConfig {
    /** Unique name for the service. */
    name: string;
    /** Working directory for the process. */
    cwd: string;
    /** Command to execute (e.g., 'node', 'npm'). */
    command: string;
    /** Arguments for the command. */
    args?: string[];
    /** Environment variables to inject. */
    env?: Record<string, string>;
    /** The environment variable name used to pass the assigned port (default: 'PORT'). */
    portEnvVar?: string;
    /** If true, the system waits for the service to start (port check) before proceeding. */
    waitForStartup?: boolean;
    /** Maximum time to wait for startup in milliseconds (default: 30000). */
    startupTimeoutMs?: number;
}
/**
 * KrnlManagedServiceHandle
 * Runtime handle for a managed service instance.
 */
export interface KrnlManagedServiceHandle {
    config: KrnlManagedServiceConfig;
    port: number;
    status: 'starting' | 'running' | 'failed' | 'stopped';
    processHandle?: any;
    pid?: number;
}
export interface KrnlIngressNetworkMemberConfig {
    ServiceClass?: any;
    prefix: string;
    port?: number;
    constructorArgs?: any[];
    isKrnl?: boolean;
    entryPath?: string;
}
export interface KrnlFrontendOptions {
    title?: string;
    theme?: 'dark' | 'light';
    logoUrl?: string;
    enableMonitoringApi?: boolean;
    customCss?: string;
}
export interface KrnlCustomFrontendOptions {
    mode?: 'dev' | 'prod';
    startupTimeoutMs?: number;
    env?: Record<string, string>;
    backendPort?: number;
    backendHost?: string;
    frontendPrefix?: string;
}
export interface KrnlFrontendMemberConfig {
    name: string;
    appPath: string;
    options?: KrnlCustomFrontendOptions;
}
export interface KrnlBridgeDescriptor {
    name: string;
    backendPort?: number;
    backendHost?: string;
    on?: Record<string, (data: any, adapter: any) => void>;
    expose?: string[];
}
export interface BlockRoute {
    path: string;
    type: 'page' | 'layout' | 'api';
}
export interface BlockApiEndpoint {
    path: string;
    methods: string[];
}
export interface BlockDescriptor {
    id: string;
    name: string;
    version?: string;
    routes: BlockRoute[];
    apis: BlockApiEndpoint[];
}
export type { KrnlEndpointDefinition, KrnlIntelligenceSpec, KrnlOrchestratorMemory, KrnlAiExecutionTrace, KrnlWatchVariable } from "./K_LIB_Krnl_Ai_Concepts.js";
//# sourceMappingURL=types.d.ts.map