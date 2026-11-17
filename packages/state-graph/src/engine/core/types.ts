/** Standard result type for operations that can fail */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/** Standard logger interface */
export interface Logger {
  log(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug?(message: string, ...args: unknown[]): void;
}

/** Disposable resource interface */
export interface Disposable {
  dispose(): Promise<void>;
}

/** Generic provider interface */
export interface Provider<_T = unknown> {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  isInitialized(): boolean;
}

/** Configuration for any Skipo component */
export interface SkipoConfig {
  name: string;
  logger?: Logger;
  [key: string]: unknown;
}
