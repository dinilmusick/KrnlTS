import { z } from "zod";

export interface KrnlFunctionality<I = any, O = any> {
    id: string;
    api: (input: I, context: { entity: any, state: any }) => Promise<O>;
    schema?: z.ZodType<I>;
    visibility?: "public" | "private" | "protected";
    description?: string;
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
