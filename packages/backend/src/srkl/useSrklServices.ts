/**
 * @file useSrklServices.ts
 * @description React Hook for discovering and consuming services from SRKL Vaults.
 * Strictly adheres to Skipo governance (< 200 lines).
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SrklClient, CANONICAL_SRKL_URL } from './SrklClient.js';
import type { SrklServiceAccount } from './types.js';

export interface UseSrklServicesOptions {
  srklUrl?: string;
  declaredTypes: string[];
  userId?: string;
  token?: string;
  workspaceId?: string;
  autoFetch?: boolean;
}

export interface UseSrklServicesResult {
  services: SrklServiceAccount[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  latencyMs: number | null;
  refetch: (force?: boolean) => Promise<void>;
  srklUrl: string;
  setSrklUrl: (url: string) => void;
  client: SrklClient;
}

export function useSrklServices(options: UseSrklServicesOptions): UseSrklServicesResult {
  const { declaredTypes, userId, token, workspaceId, autoFetch = true } = options;
  const getStoredUrl = (): string | null => {
    try {
      return (globalThis as any)?.localStorage?.getItem('srkl_endpoint_url') || null;
    } catch {
      return null;
    }
  };

  const initialUrl = options.srklUrl || getStoredUrl() || CANONICAL_SRKL_URL;

  const [srklUrl, setSrklUrlState] = useState<string>(initialUrl);
  const [services, setServices] = useState<SrklServiceAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const hasFetchedRef = useRef(false);

  const client = useMemo(
    () => new SrklClient({ srklUrl, userId, token, workspaceId }),
    [srklUrl, userId, token, workspaceId]
  );

  const setSrklUrl = useCallback((url: string) => {
    const clean = url.trim().replace(/\/+$/, '');
    setSrklUrlState(clean);
    try {
      (globalThis as any)?.localStorage?.setItem('srkl_endpoint_url', clean);
    } catch {}
  }, []);

  const refetch = useCallback(async (force = false) => {
    if (!declaredTypes || declaredTypes.length === 0) return;
    if (hasFetchedRef.current && !force) return;
    hasFetchedRef.current = true;
    setLoading(true);
    setError(null);

    const health = await client.checkHealth();
    setIsConnected(health.ok);
    setLatencyMs(health.latencyMs);

    if (!health.ok) {
      setLoading(false);
      setError(`Cannot connect to SRKL Hub at ${srklUrl}`);
      return;
    }

    try {
      const data = await client.getServices(declaredTypes);
      const filtered = SrklClient.filterRelevantServices(data, declaredTypes);
      setServices(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch services from SRKL');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [client, declaredTypes, srklUrl]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [refetch, autoFetch]);

  return {
    services,
    loading,
    error,
    isConnected,
    latencyMs,
    refetch,
    srklUrl,
    setSrklUrl,
    client,
  };
}
