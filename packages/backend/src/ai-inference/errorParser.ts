/**
 * @file errorParser.ts
 * @description Provider-neutral error parser and classifier for AI inference
 */

import type { ProviderId } from '../ai-provider/types.js';
import type { ErrorClassification, ParsedProviderError } from './types.js';

export function parseErrorJson(rawMsg: string): Record<string, unknown> | null {
  try {
    if (typeof rawMsg === 'string') {
      const trimmed = rawMsg.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return JSON.parse(trimmed);
      }
    }
  } catch {}
  return null;
}

export function classifyAndFormatError(
  providerId: ProviderId,
  modelId: string,
  rawError: unknown,
  httpStatus?: number
): { error: Error; details: ParsedProviderError } {
  const rawMsg = rawError instanceof Error ? rawError.message : String(rawError || '');
  const parsedJson = parseErrorJson(rawMsg);
  const errorObj = (parsedJson?.error || parsedJson) as Record<string, unknown> | undefined;
  const statusNumber =
    httpStatus ||
    (typeof errorObj?.code === 'number' ? errorObj.code : undefined) ||
    (typeof (rawError as Record<string, unknown>)?.status === 'number'
      ? ((rawError as Record<string, unknown>).status as number)
      : undefined);

  const statusStr = String(errorObj?.status || (rawError as Record<string, unknown>)?.status || '');
  const detailedMsg =
    typeof errorObj?.message === 'string'
      ? errorObj.message
      : typeof errorObj === 'string'
      ? errorObj
      : rawMsg;

  const combinedLower = (
    detailedMsg +
    ' ' +
    statusStr +
    ' ' +
    ((rawError as Error)?.name || '')
  ).toLowerCase();

  let classification: ErrorClassification = 'UNKNOWN';
  let suggestion = 'Check network connectivity or retry request.';
  let isModelSpecific = false;
  let isKeySpecific = false;

  if (
    statusNumber === 404 ||
    statusStr === 'NOT_FOUND' ||
    combinedLower.includes('not found') ||
    combinedLower.includes('deprecated')
  ) {
    classification = 'MODEL_UNAVAILABLE';
    isModelSpecific = true;
    suggestion = 'Auto-failover router will bypass this model for subsequent calls.';
  } else if (
    statusNumber === 401 ||
    statusNumber === 403 ||
    combinedLower.includes('unauthorized') ||
    combinedLower.includes('invalid api key')
  ) {
    classification = 'AUTH_FAILURE';
    isKeySpecific = true;
    suggestion = 'Check key validity in Key Manager or rotate key.';
  } else if (
    statusNumber === 429 ||
    combinedLower.includes('rate limit') ||
    combinedLower.includes('quota exceeded')
  ) {
    classification = 'RATE_LIMITED';
    isKeySpecific = true;
    suggestion = 'Failover router will immediately switch to alternate keys/models.';
  } else if (
    statusNumber === 402 ||
    combinedLower.includes('insufficient credits') ||
    combinedLower.includes('billing')
  ) {
    classification = 'PAYMENT_REQUIRED';
    isKeySpecific = true;
    suggestion = 'Add funds or switch to a free tier provider.';
  } else if (
    combinedLower.includes('maximum context length') ||
    combinedLower.includes('too many tokens')
  ) {
    classification = 'CONTEXT_OVERFLOW';
    isModelSpecific = true;
    suggestion = 'Enable compression or route to a larger context model.';
  } else if (statusNumber === 400 || combinedLower.includes('bad request')) {
    classification = 'PARAMETER_MISMATCH';
    isModelSpecific = true;
    suggestion = 'Re-check model ID in catalog or verify API key syntax.';
  } else if (statusNumber && statusNumber >= 500) {
    classification = 'SERVER_ERROR';
  }

  const formatted = `[${providerId.toUpperCase()} ${classification}${
    statusNumber ? ` (${statusNumber})` : ''
  }]: ${detailedMsg}`;

  return {
    error: new Error(formatted),
    details: {
      classification,
      providerId,
      modelId,
      statusCode: statusNumber,
      message: formatted,
      suggestion,
      isModelSpecific,
      isKeySpecific,
    },
  };
}
