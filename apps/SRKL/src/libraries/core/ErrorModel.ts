/**
 * @file ErrorModel.ts
 * @description SRKLError normalized error model conforming to Srkl-spec.md Section 23.
 * File size < 200 lines strictly.
 */

export interface SRKLErrorOptions {
  code: string;
  message: string;
  service: string;
  operation: string;
  retryable?: boolean;
  remoteCode?: string | number;
  cause?: unknown;
}

export class SRKLError extends Error {
  public readonly code: string;
  public readonly service: string;
  public readonly operation: string;
  public readonly retryable: boolean;
  public readonly remoteCode?: string | number;
  public readonly timestamp: string;

  constructor(options: SRKLErrorOptions) {
    super(options.message);
    this.name = 'SRKLError';
    this.code = options.code;
    this.service = options.service;
    this.operation = options.operation;
    this.retryable = options.retryable ?? false;
    this.remoteCode = options.remoteCode;
    this.timestamp = new Date().toISOString();
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      service: this.service,
      operation: this.operation,
      retryable: this.retryable,
      remoteCode: this.remoteCode,
      timestamp: this.timestamp,
    };
  }

  public static fromUnknown(err: unknown, service: string, operation: string): SRKLError {
    if (err instanceof SRKLError) {
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    return new SRKLError({
      code: 'ERR_OPERATION_FAILED',
      message,
      service,
      operation,
      retryable: false,
    });
  }
}
