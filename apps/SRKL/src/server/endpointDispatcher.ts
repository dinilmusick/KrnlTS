/**
 * @file endpointDispatcher.ts
 * @description Real HTTP request dispatcher for service endpoints & Google Cloud APIs.
 * File size < 200 lines strictly.
 */

import { EndpointDefinition } from '@/libraries/types/srkl';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';

export interface DispatchResult {
  success: boolean;
  statusCode: number;
  statusText: string;
  endpoint: string;
  method: string;
  resolvedUrl: string;
  durationMs: number;
  data: unknown;
  error?: string;
}

export async function dispatchEndpoint(
  endpoint: EndpointDefinition,
  serviceId: string,
  params: {
    pathParams?: Record<string, string>;
    queryParams?: Record<string, string>;
    headers?: Record<string, string>;
    body?: unknown;
  },
  account?: ServiceAccount
): Promise<DispatchResult> {
  const startTime = Date.now();
  const creds = account ? account.getAllCredentials() : {};

  // Resolve Path Parameters
  let resolvedPath = endpoint.path.replace(/\{([^}]+)\}/g, (_, paramName) => {
    if (params.pathParams?.[paramName]) return encodeURIComponent(params.pathParams[paramName]);
    if (paramName === 'projectId') return encodeURIComponent(String(creds['projectId'] || '207414612407'));
    if (paramName === 'owner') return encodeURIComponent(String(creds['owner'] || creds['account'] || 'user'));
    if (paramName === 'repo') return encodeURIComponent(String(creds['repo'] || 'srkl-service-hub'));
    if (paramName === 'id' || paramName === 'deploymentId') return encodeURIComponent(String(params.pathParams?.id || 'dpl_latest'));
    if (paramName === 'accountId' || paramName === 'account_id') return encodeURIComponent(String(params.pathParams?.accountId || creds['accountId'] || ''));
    if (paramName === 'idOrName') return encodeURIComponent(String(creds['projectName'] || 'srkl-app'));
    if (paramName === 'model') return 'gemini-2.5-flash';
    return `{${paramName}}`;
  });

  // Query Parameters
  const queryParams = { ...params.queryParams };
  if (resolvedPath.includes('/google-ai-studio/apps') && !queryParams['googleAccount']) {
    const accEmail = creds['googleAccount'] || creds['account'] || account?.name;
    if (accEmail) queryParams['googleAccount'] = String(accEmail);
  }

  // Attach account context for health and resource inquiries
  if (resolvedPath === '/health' || resolvedPath === '/resources') {
    if (!queryParams['serviceId']) queryParams['serviceId'] = serviceId;
    if (account?.id && !queryParams['accountId']) queryParams['accountId'] = account.id;
    if (creds['apiKey'] && !queryParams['apiKey']) queryParams['apiKey'] = String(creds['apiKey']);
    if (creds['googleAccount'] && !queryParams['googleAccount']) queryParams['googleAccount'] = String(creds['googleAccount']);
  }

  const queryString = Object.keys(queryParams).length > 0
    ? `?${new URLSearchParams(queryParams as Record<string, string>).toString()}`
    : '';

  // Determine Full URL
  let targetUrl = '';
  if (resolvedPath.startsWith('http://') || resolvedPath.startsWith('https://')) {
    targetUrl = `${resolvedPath}${queryString}`;
  } else if ((serviceId.includes('gemini') || serviceId.includes('google-ai-studio')) && (resolvedPath.startsWith('/v1beta/') || resolvedPath.startsWith('/v1/'))) {
    targetUrl = `https://generativelanguage.googleapis.com${resolvedPath}${queryString}`;
  } else if (serviceId.includes('github') && (resolvedPath.startsWith('/user') || resolvedPath.startsWith('/repos') || resolvedPath.startsWith('/rate_limit') || resolvedPath.startsWith('/orgs'))) {
    targetUrl = `https://api.github.com${resolvedPath}${queryString}`;
  } else if (serviceId.includes('vercel') && (resolvedPath.startsWith('/v') || resolvedPath.startsWith('/deployments') || resolvedPath.startsWith('/projects') || resolvedPath.startsWith('/user'))) {
    targetUrl = `https://api.vercel.com${resolvedPath}${queryString}`;
  } else if (serviceId.includes('cloudflare') && (resolvedPath.startsWith('/client/v4') || resolvedPath.startsWith('/accounts') || resolvedPath.startsWith('/user') || resolvedPath.startsWith('/zones'))) {
    targetUrl = `https://api.cloudflare.com/client/v4${resolvedPath.replace(/^\/client\/v4/, '')}${queryString}`;
  } else if (resolvedPath === '/health' || resolvedPath === '/resources') {
    targetUrl = `http://127.0.0.1:3000/api/services${resolvedPath}${queryString}`;
  } else if (resolvedPath.startsWith('/')) {
    targetUrl = `http://127.0.0.1:3000${resolvedPath}${queryString}`;
  } else {
    targetUrl = `https://api.${serviceId.replace('srv-', '')}.internal/${resolvedPath}${queryString}`;
  }

  // Resolve Authentication & Request Headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'SRKL-Universal-Hub/1.0',
    ...endpoint.headers,
    ...params.headers,
  };

  if (serviceId.includes('github')) {
    headers['X-GitHub-Api-Version'] = '2022-11-28';
  }

  if (endpoint.authentication) {
    const token = creds['apiToken'] || creds['token'] || creds['accessToken'] || creds['pat'] || creds['apiKey'] || creds['bearerToken'];
    const apiKey = creds['apiKey'];
    const email = creds['email'];
    const globalApiKey = creds['globalApiKey'];

    if (token) {
      headers['Authorization'] = `Bearer ${String(token)}`;
    } else if (email && globalApiKey) {
      headers['X-Auth-Email'] = String(email);
      headers['X-Auth-Key'] = String(globalApiKey);
    } else if (apiKey) {
      if (targetUrl.includes('googleapis.com')) {
        headers['x-goog-api-key'] = String(apiKey);
        if (!targetUrl.includes('key=')) {
          targetUrl += (targetUrl.includes('?') ? '&' : '?') + `key=${encodeURIComponent(String(apiKey))}`;
        }
      } else {
        headers['Authorization'] = `Bearer ${String(apiKey)}`;
      }
    }
  }

  // Format Request Body
  let requestBody: string | undefined = undefined;
  if (params.body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    requestBody = typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
  }

  try {
    const response = await fetch(targetUrl, {
      method: endpoint.method,
      headers,
      body: requestBody,
      signal: AbortSignal.timeout(12000),
    });

    const durationMs = Date.now() - startTime;
    let responseData: unknown = null;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      success: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      endpoint: endpoint.name,
      method: endpoint.method,
      resolvedUrl: targetUrl,
      durationMs,
      data: responseData,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      statusCode: 502,
      statusText: 'Bad Gateway',
      endpoint: endpoint.name,
      method: endpoint.method,
      resolvedUrl: targetUrl,
      durationMs,
      error: errorMsg,
      data: { error: errorMsg, hint: 'Target API endpoint or Google Cloud service returned connection error' },
    };
  }
}
