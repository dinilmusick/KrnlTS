/**
 * @file endpointExecutor.ts
 * @description Real-time execution runtime for service endpoints.
 * Dispatches interpolated requests, attaches credentials, measures latency,
 * and normalizes structured response telemetry.
 * File size < 200 lines strictly.
 */

import { ServiceAccount } from '../core/ServiceAccount';
import { EndpointDefinition, ServiceDefinition } from '../types/srkl';
import { ServiceProvider } from '../core/ServiceProvider';

export interface EndpointExecutionParams {
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body: string;
}

export interface EndpointExecutionResult {
  success: boolean;
  statusCode: number;
  statusText: string;
  durationMs: number;
  url: string;
  method: string;
  sentHeaders: Record<string, string>;
  sentPayload?: unknown;
  data: unknown;
  timestamp: string;
  error?: string;
}

export async function executeEndpoint(
  account: ServiceAccount,
  endpoint: EndpointDefinition,
  params: EndpointExecutionParams,
  provider?: ServiceProvider,
  definition?: ServiceDefinition
): Promise<EndpointExecutionResult> {
  const startTime = performance.now();
  const creds = account.getAllCredentials();

  let resolvedPath = endpoint.path.replace(/\{([^}]+)\}/g, (_, paramName) => {
    if (params.pathParams[paramName]) return encodeURIComponent(params.pathParams[paramName]);
    if (paramName === 'model') return 'gemini-2.5-flash';
    if (paramName === 'owner') return (creds['owner'] as string) || 'octocat';
    if (paramName === 'repo') return 'srkl-service-hub';
    if (paramName === 'bucket' || paramName === 'bucketName') return 'srkl-vault-media';
    if (paramName === 'fileName') return 'nature-cyber-grid.webp';
    return `{${paramName}}`;
  });

  const queryEntries = Object.entries(params.queryParams).filter(([_, v]) => v);
  const queryString = queryEntries.length > 0 ? `?${new URLSearchParams(params.queryParams).toString()}` : '';
  const fullUrl = `https://api.${account.serviceId.replace('srv-', '')}.internal${resolvedPath}${queryString}`;

  const resolvedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Agent': 'SRKL-Hub/1.0',
    ...endpoint.headers,
    ...params.headers,
  };

  if (endpoint.authentication) {
    if (creds['apiKey']) resolvedHeaders['x-goog-api-key'] = String(creds['apiKey']);
    else if (creds['token']) resolvedHeaders['Authorization'] = `Bearer ${String(creds['token'])}`;
    else if (creds['applicationKey']) resolvedHeaders['Authorization'] = `Basic ${btoa(`${creds['keyId'] || 'key'}:${creds['applicationKey']}`)}`;
  }

  let parsedBody: unknown = undefined;
  if (params.body?.trim() && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    try { parsedBody = JSON.parse(params.body); } catch { parsedBody = params.body; }
  }

  try {
    const serverRes = await fetch('/api/services/execute-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: account.serviceId,
        endpoint,
        pathParams: params.pathParams,
        queryParams: params.queryParams,
        headers: resolvedHeaders,
        body: parsedBody,
        accountId: account.id,
        account: account.toJSON(),
      }),
    });

    const dispatchData = await serverRes.json();
    const durationMs = dispatchData.durationMs || Math.round(performance.now() - startTime);

    return {
      success: dispatchData.success !== false && serverRes.ok,
      statusCode: dispatchData.statusCode || serverRes.status,
      statusText: dispatchData.statusText || (serverRes.ok ? 'OK' : 'ERROR'),
      durationMs,
      url: dispatchData.resolvedUrl || fullUrl,
      method: endpoint.method,
      sentHeaders: resolvedHeaders,
      sentPayload: parsedBody,
      data: dispatchData.data ?? dispatchData,
      timestamp: new Date().toISOString(),
      error: dispatchData.error,
    };
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      statusCode: 500,
      statusText: 'INTERNAL_ERROR',
      durationMs,
      url: fullUrl,
      method: endpoint.method,
      sentHeaders: resolvedHeaders,
      sentPayload: parsedBody,
      data: { error: errorMsg, code: 'ERR_ENDPOINT_DISPATCH_FAILURE' },
      timestamp: new Date().toISOString(),
      error: errorMsg,
    };
  }
}
