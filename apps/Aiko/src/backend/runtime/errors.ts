export type RuntimeErrorCode =
  | 'AUTHENTICATION_FAILED' | 'PROVIDER_UNAVAILABLE' | 'QUOTA_EXHAUSTED'
  | 'RESOURCE_UNAVAILABLE' | 'RUNTIME_CREATION_FAILED' | 'CONNECTION_FAILED'
  | 'COMMAND_FAILED' | 'TIMEOUT' | 'CAPABILITY_UNSUPPORTED'
  | 'RUNTIME_TERMINATED' | 'RUNTIME_NOT_FOUND' | 'INVALID_CONFIGURATION'
  | 'INVALID_ACCOUNT' | 'SECRET_LEAK_PREVENTED' | 'INVALID_HANDLE';

export class RuntimeProviderError extends Error {
  constructor(public readonly code: RuntimeErrorCode, message: string, public readonly retryable = false, options?: ErrorOptions) {
    super(message, options); this.name = 'RuntimeProviderError';
  }
}
export function normalizeRuntimeError(error: unknown, fallback: RuntimeErrorCode): RuntimeProviderError {
  if (error instanceof RuntimeProviderError) return error;
  if (error instanceof Error && error.name === 'AbortError') return new RuntimeProviderError('TIMEOUT', 'Runtime operation was cancelled.');
  const message = error instanceof Error ? error.message : String(error);
  return new RuntimeProviderError(fallback, message, fallback === 'PROVIDER_UNAVAILABLE' || fallback === 'CONNECTION_FAILED', { cause: error });
}
