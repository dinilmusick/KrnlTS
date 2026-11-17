import { luthFetch } from '../../auth/luthAuthClient';
/**
 * @file credentialVerificationHelper.ts
 * @description Pre-flight verification routines for external cloud service credentials.
 * File size < 200 lines strictly.
 */

import { ServiceDefinition } from '@/libraries/types/srkl';

export interface VerificationResult {
  success: boolean;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

export async function verifyCredentials(
  service: ServiceDefinition,
  credentials: Record<string, string>
): Promise<VerificationResult> {
  // 1. Check all mandatory fields first
  for (const field of service.credentialFields) {
    if (field.required && !credentials[field.name]?.trim()) {
      return {
        success: false,
        message: `Mandatory field '${field.label || field.name}' is missing.`,
        error: `Please provide ${field.label || field.name}`,
      };
    }
  }

  // 2. Google AI Studio live API verification
  if (service.identifier === 'google-ai-studio') {
    const email = credentials['googleAccount']?.trim();
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Invalid Google Account email format.',
        error: 'Please enter a valid developer Google email (e.g. yourname@gmail.com).',
      };
    }

    const apiKey = credentials['apiKey']?.trim();
    if (!apiKey || apiKey.length < 8) {
      return {
        success: false,
        message: 'Google AI Studio API key is missing or incomplete.',
        error: 'Please provide a valid API key from https://aistudio.google.com/apikey',
      };
    }

    const projectId = credentials['projectId']?.trim();
    if (!projectId) {
      return {
        success: false,
        message: 'Google Cloud Project ID is MANDATORY.',
        error: 'Please provide a valid Google Cloud Project ID (e.g. 207414612407 or 14948072).',
      };
    }

    const accessToken = credentials['accessToken']?.trim();
    if (!accessToken) {
      return {
        success: false,
        message: 'OAuth 2.0 Access Token is MANDATORY.',
        error: 'Please provide a valid OAuth 2.0 Access Token with run.services.list scope.',
      };
    }

    try {
      const res = await luthFetch('/api/google-ai-studio/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleAccount: email,
          apiKey,
          projectId: credentials['projectId']?.trim() || '',
          accessToken: credentials['accessToken']?.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.error || 'Google AI Studio verification rejected the provided credentials.',
          error: data.error,
        };
      }
      return {
        success: true,
        message: `Verified with Google AI Studio (${data.modelsCount ?? 'active'} foundation models accessible)`,
        details: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Network failure connecting to verification server: ${msg}`,
        error: msg,
      };
    }
  }

  // 3. Cloudflare live API verification
  if (service.identifier === 'cloudflare') {
    const apiToken = credentials['apiToken']?.trim() || credentials['token']?.trim();
    const accountId = credentials['accountId']?.trim() || credentials['cfAccountId']?.trim();

    if (!apiToken) {
      return {
        success: false,
        message: 'Cloudflare API Token is required.',
        error: 'Please provide a valid API Token from Cloudflare dashboard',
      };
    }
    if (!accountId) {
      return {
        success: false,
        message: 'Cloudflare Account ID is required.',
        error: 'Please provide your Cloudflare Account ID',
      };
    }

    try {
      const q = new URLSearchParams({
        serviceId: 'cloudflare',
        token: apiToken,
        cfAccountId: accountId,
      });

      const res = await luthFetch(`/api/services/health?${q.toString()}`);
      const data = await res.json();

      if (!res.ok || data.status === 'DEGRADED' || data.status === 'OFFLINE' || data.success === false) {
        return {
          success: false,
          message: data.error || 'Cloudflare API rejected the provided credentials.',
          error: data.error,
        };
      }

      return {
        success: true,
        message: `Verified with Cloudflare API (${data.status === 'ONLINE' ? 'Active & Valid Token' : 'Connected'})`,
        details: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Network failure connecting to Cloudflare verification: ${msg}`,
        error: msg,
      };
    }
  }

  // Default success for basic services
  return {
    success: true,
    message: 'Mandatory fields validated.',
  };
}
