import { z } from "zod";

export interface KrnlFunctionality<I = any, O = any> {
    id: string;
    api: (input: I, context: { entity: any, state: any }) => Promise<O>;
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

// ── Endpoint Access Control ───────────────────────────────────────────────

/**
 * DefaultConnectionBehaviour
 * Governs treatment of ports not listed in allow / allow_with_key / forbid.
 *
 *   allow_unlisted    → unlisted ports pass through   (open endpoints)
 *   ask_key_unlisted  → unlisted ports must supply key (keyed external endpoints)
 *   forbid_unlisted   → unlisted ports are rejected    (internal endpoints)
 */
export type DefaultConnectionBehaviour =
  | 'allow_unlisted'
  | 'ask_key_unlisted'
  | 'forbid_unlisted';

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
  allow:                      number[];
  allow_with_key:             number[];
  forbid:                     number[];
  default_connection_behaviour: DefaultConnectionBehaviour;
}

/**
 * EndpointCategory — semantic labels for pre-configured access policies.
 *
 *   internal_endpoint          → allow = [registered service ports], default = forbid_unlisted
 *   external_endpoint / free   → default = allow_unlisted
 *   external_endpoint / keyed  → default = ask_key_unlisted  (requires accessKey)
 */
export type EndpointCategory =
  | { kind: 'internal_endpoint' }
  | { kind: 'external_endpoint'; access: 'free' | 'keyed'; accessKey?: string };

// ── Managed Services ──────────────────────────────────────────────────────

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
  processHandle?: any; // SpawnHandle
  pid?: number;
}

/**
 * KrnlIngressNetworkMemberConfig
 *
 * ⚠ SIBLING NETWORK ONLY — do NOT use this for embedding sub-apps inside a parent.
 *
 * This config is used exclusively by KrnlSiblingNetwork (formerly KrnlIngressNetwork)
 * to connect independent, standalone KrnlTS applications that each run with their own
 * networking stack (HTTP / WebSocket).
 *
 * For embedded sub-apps use KrnlSubAppConfig + entity.loadSubApps() instead.
 */
export interface KrnlIngressNetworkMemberConfig {
  ServiceClass?: any;
  prefix: string;
  /** Port for the standalone sibling app's HTTP/WS server. Not used for sub-apps. */
  port?: number;
  constructorArgs?: any[];
  isKrnl?: boolean;
  entryPath?: string;
}

// ── Sub-App Execution Model ───────────────────────────────────────────────────

/**
 * KrnlSubAppExecutionMode
 *
 * Determines how a sub-app is hosted by the parent application.
 * This is a RUNTIME/KERNEL decision set in the parent's krnl.json — the sub-app
 * code never changes regardless of which mode is chosen.
 *
 *   'local'  → sub-app entity lives in the parent process; communication is a
 *               direct in-process method call. Zero networking overhead.
 *
 *   'worker' → sub-app entity lives in a worker_thread managed by the parent;
 *               communication is via MessagePort IPC. No HTTP · No TCP · No WebSocket.
 */
export type KrnlSubAppExecutionMode = 'local' | 'worker';

/**
 * KrnlSubAppConfig
 *
 * Configuration passed to entity.loadSubApps() when embedding a KrnlTS app as a
 * sub-app inside a parent. The executionMode is read from the parent's krnl.json
 * and injected here by the MagneticLoader; sub-apps do not declare it themselves.
 */
export interface KrnlSubAppConfig {
  /** Directory name of the sub-app under subapps/ */
  prefix: string;
  /** The sub-app class (must extend krnlSystemEntityBase). */
  ServiceClass?: any;
  /** Absolute path to the sub-app's compiled entry module. */
  entryPath?: string;
  /** Execution mode as read from the parent's krnl.json. Defaults to 'local'. */
  executionMode?: KrnlSubAppExecutionMode;
  /** Extra constructor arguments forwarded to the sub-app class. */
  constructorArgs?: any[];
  /** Whether the sub-app is a KrnlTS app (true) or a non-KrnlTS adapter (false). */
  isKrnl?: boolean;
}

/**
 * KrnlSubAppEntry
 *
 * Live registry entry stored in entity._subAppRegistry after a sub-app is loaded.
 */
export interface KrnlSubAppEntry {
  prefix:        string;
  executionMode: KrnlSubAppExecutionMode;
  /** Local entity instance (local mode) or KrnlSubAppWorkerHost proxy (worker mode). */
  entity:        any;
  addedAt:       number;
}

export interface KrnlUiFieldSpec {
  field: string;
  component: 'KrnlTextInput' | 'KrnlNumberInput' | 'KrnlToggle' | 'KrnlDropdown' 
           | 'KrnlTextArea' | 'KrnlJsonInput' | 'KrnlJsonViewer' | 'KrnlCarousel' 
           | 'KrnlTile' | 'KrnlSSELog';
  label?: string;
  options?: string[];
  placeholder?: string;
  /** Names a globally shared UI component instance across endpoints. */
  sharedComponentId?: string;
  /** Dot-path into response to extract data array (e.g. 'names' or 'data.items'). */
  dataPath?: string;
  /** For object array responses: key for option value (e.g. 'id'). */
  valueKey?: string;
  /** For object array responses: key for option label (e.g. 'name'). */
  labelKey?: string;
  /** Input bind mode: 'selected' sends single item, 'all' sends full array. Defaults to 'selected'. */
  bindMode?: 'selected' | 'all';
  /** If true, output source endpoint is auto-called on mount to pre-populate shared component. */
  autoFetch?: boolean;
}

export interface KrnlUiSpec {
  ui_component_enabled: boolean;
  ui_component_type?: 'form' | 'dashboard_tile' | 'monitor' | 'carousel';
  inputs?: KrnlUiFieldSpec[];
  outputs?: KrnlUiFieldSpec[];
}

export interface KrnlFrontendOptions {
  title?: string;
  theme?: 'dark' | 'light';
  logoUrl?: string;
  enableMonitoringApi?: boolean;
  customCss?: string;
  frontendDir?: string;
}

export type {
  KrnlEndpointDefinition,
  KrnlIntelligenceSpec,
  KrnlOrchestratorMemory,
  KrnlAiExecutionTrace,
  KrnlWatchVariable
} from "./K_LIB_Krnl_Ai_Concepts.js";





