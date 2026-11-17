import { RuntimeProviderError } from './errors.js';
import type { RuntimeHandle } from './types.js';

const SECRET_KEY = /(?:credentials?|credentialref|secret(?:ref)?|token|password|private.?key|authorization|api.?key|client.?secret|access.?key)$/i;
const CAPABILITIES = ['exec', 'filesystem', 'ssh', 'http', 'ports', 'persistent'];
export function assertSecretFree(value: unknown, path = 'input'): void {
  if (Array.isArray(value)) { value.forEach((item, index) => assertSecretFree(item, path + '[' + index + ']')); return; }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY.test(key)) throw new RuntimeProviderError('SECRET_LEAK_PREVENTED', 'Inline secret-like field rejected at ' + path + '.' + key);
    assertSecretFree(item, path + '.' + key);
  }
}
function assertSafeString(value: string, path: string): void {
  if (/^[a-z]+:\/\/[^/\s:@]+:[^/@\s]+@/i.test(value)) throw new RuntimeProviderError('SECRET_LEAK_PREVENTED', 'Credential-bearing URL rejected at ' + path);
  try {
    const url = new URL(value);
    for (const key of url.searchParams.keys()) if (SECRET_KEY.test(key)) {
      throw new RuntimeProviderError('SECRET_LEAK_PREVENTED', 'Secret query parameter rejected at ' + path);
    }
  } catch (error) { if (error instanceof RuntimeProviderError) throw error; }
}
function credentialSecretValues(credential: import('../types/credentials.js').Credential): string[] {
  const values: string[] = [];
  const visit = (value: unknown, key = ''): void => {
    if (typeof value === 'string') {
      if (SECRET_KEY.test(key) && value.length >= 4) values.push(value);
      return;
    }
    if (Array.isArray(value)) { value.forEach(item => visit(item, key)); return; }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([childKey, child]) => visit(child, childKey));
    }
  };
  visit(credential.data);
  return [...new Set(values)].sort((a, b) => b.length - a.length);
}
export function assertNoCredentialMaterial(value: unknown, credential: import('../types/credentials.js').Credential): void {
  const secrets = credentialSecretValues(credential);
  const visit = (item: unknown, path: string): void => {
    if (typeof item === 'string') {
      if (secrets.some(secret => item.includes(secret))) {
        throw new RuntimeProviderError('SECRET_LEAK_PREVENTED', 'Provider metadata contains credential material at ' + path);
      }
      return;
    }
    if (Array.isArray(item)) { item.forEach((child, index) => visit(child, path + '[' + index + ']')); return; }
    if (item && typeof item === 'object') Object.entries(item as Record<string, unknown>).forEach(([key, child]) => visit(child, path + '.' + key));
  };
  visit(value, 'providerResponse');
}
export function redactRuntimeText(value: string, credential: import('../types/credentials.js').Credential): string {
  let redacted = value;
  for (const secret of credentialSecretValues(credential)) redacted = redacted.split(secret).join('[REDACTED]');
  return redacted;
}
export function redactRuntimeValue(value: unknown, credential: import('../types/credentials.js').Credential): unknown {
  if (typeof value === 'string') return redactRuntimeText(value, credential);
  if (Array.isArray(value)) return value.map(item => redactRuntimeValue(item, credential));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key, SECRET_KEY.test(key) ? '[REDACTED]' : redactRuntimeValue(item, credential),
  ]));
}
export function sanitizeRuntimeHandle(handle: RuntimeHandle): RuntimeHandle {
  if (!handle || typeof handle !== 'object' || handle.schemaVersion !== '1.0.0') throw new RuntimeProviderError('INVALID_HANDLE', 'Runtime handle schema is invalid.');
  const required = ['id', 'workspaceId', 'providerId', 'accountId', 'providerRuntimeId', 'executionId', 'createdAt', 'updatedAt'];
  for (const key of required) if (typeof (handle as any)[key] !== 'string' || !(handle as any)[key]) {
    throw new RuntimeProviderError('INVALID_HANDLE', 'Runtime handle is missing ' + key + '.');
  }
  if (!['transient', 'persistent'].includes(handle.persistence) ||
      !['creating', 'ready', 'running', 'stopped', 'failed', 'terminating', 'terminated', 'unknown'].includes(handle.lifecycle)) {
    throw new RuntimeProviderError('INVALID_HANDLE', 'Runtime handle lifecycle or persistence is invalid.');
  }
  if (!Array.isArray(handle.capabilities) || !handle.capabilities.every(item => CAPABILITIES.includes(item))) {
    throw new RuntimeProviderError('INVALID_HANDLE', 'Runtime handle capabilities are invalid.');
  }
  const safe = JSON.parse(JSON.stringify(handle)) as RuntimeHandle;
  assertSecretFree(safe);
  const inspect = (value: unknown, path: string): void => {
    if (typeof value === 'string') assertSafeString(value, path);
    else if (Array.isArray(value)) value.forEach((item, index) => inspect(item, path + '[' + index + ']'));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => inspect(item, path + '.' + key));
  };
  inspect(safe.access, 'access'); inspect(safe.resource, 'resource');
  return safe;
}
export function serializeRuntimeHandle(handle: RuntimeHandle): string { return JSON.stringify(sanitizeRuntimeHandle(handle)); }
export function deserializeRuntimeHandle(serialized: string): RuntimeHandle {
  try { return sanitizeRuntimeHandle(JSON.parse(serialized) as RuntimeHandle); }
  catch (error) {
    if (error instanceof RuntimeProviderError) throw error;
    throw new RuntimeProviderError('INVALID_HANDLE', 'Serialized runtime handle is invalid.', false, { cause: error });
  }
}
