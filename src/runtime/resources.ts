import { FrnlFault } from './core.js';

export interface ResourceContext {
  readonly signal: AbortSignal;
  readonly scopeId: string;
}

export interface FrnlResource<T> {
  readonly id: string;
  readonly acquire: (context: ResourceContext) => Promise<T> | T;
  readonly release?: (value: T, context: ResourceContext) => Promise<void> | void;
}

export type ResourceStatus = 'idle' | 'loading' | 'ready' | 'error' | 'released';

export interface ResourceController<T> {
  readonly id: string;
  readonly status: ResourceStatus;
  readonly value?: T;
  readonly error?: FrnlFault;
  load(): Promise<T>;
  release(): Promise<void>;
}

export function defineResource<T>(resource: FrnlResource<T>): FrnlResource<T> {
  if (!resource || !resource.id || typeof resource.id !== 'string') {
    throw new TypeError('Invalid Frnl resource: missing valid id');
  }
  if (typeof resource.acquire !== 'function') {
    throw new TypeError(`Invalid Frnl resource '${resource.id}': acquire must be a function`);
  }
  return Object.freeze({ ...resource });
}

interface InternalResourceState<T> {
  status: ResourceStatus;
  value: T | undefined;
  error: FrnlFault | undefined;
  inFlightPromise: Promise<T> | undefined;
  inFlightReleasePromise: Promise<void> | undefined;
}

export function createResourceController<T>(
  resource: FrnlResource<T>,
  scopeId: string
): ResourceController<T> {
  const controller = new AbortController();
  const state: InternalResourceState<T> = {
    status: 'idle',
    value: undefined,
    error: undefined,
    inFlightPromise: undefined,
    inFlightReleasePromise: undefined,
  };

  const context: ResourceContext = Object.freeze({
    signal: controller.signal,
    scopeId,
  });

  return {
    id: resource.id,
    get status() {
      return state.status;
    },
    get value() {
      return state.value;
    },
    get error() {
      return state.error;
    },
    async load(): Promise<T> {
      if (state.status === 'ready') {
        return state.value as T;
      }
      if (state.status === 'loading' && state.inFlightPromise) {
        return state.inFlightPromise;
      }
      if (state.status === 'released') {
        throw new FrnlFault({
          code: 'RESOURCE_RELEASED',
          message: `Resource '${resource.id}' has already been released`,
        });
      }
      if (controller.signal.aborted) {
        throw new FrnlFault({
          code: 'RESOURCE_ABORTED',
          message: `Resource '${resource.id}' acquisition aborted`,
        });
      }

      state.status = 'loading';
      state.error = undefined;

      state.inFlightPromise = (async () => {
        try {
          const acquired = await Promise.resolve(resource.acquire(context));
          if (controller.signal.aborted || state.status === 'released') {
            if (resource.release && acquired !== undefined) {
              try {
                await Promise.resolve(resource.release(acquired, context));
              } catch {
                // Ignore secondary release errors when already aborted
              }
            }
            throw new FrnlFault({
              code: 'RESOURCE_ABORTED',
              message: `Resource '${resource.id}' acquired after abort or release`,
            });
          }
          state.value = acquired;
          state.status = 'ready';
          return acquired;
        } catch (err) {
          if (state.status !== 'released') {
            state.status = 'error';
            state.error =
              err instanceof FrnlFault
                ? err
                : new FrnlFault({
                    code: 'RESOURCE_ACQUIRE_FAILED',
                    message: err instanceof Error ? err.message : String(err),
                    retryable: true,
                    cause: err,
                  });
          }
          throw state.error ?? err;
        } finally {
          state.inFlightPromise = undefined;
        }
      })();

      return state.inFlightPromise;
    },

    async release(): Promise<void> {
      if (state.status === 'released') {
        return;
      }
      if (state.inFlightReleasePromise) {
        return state.inFlightReleasePromise;
      }

      state.inFlightReleasePromise = (async () => {
        state.status = 'released';
        controller.abort();

        // If load is currently in flight, await it so it completes abort cleanup
        if (state.inFlightPromise) {
          try {
            await state.inFlightPromise;
          } catch {
            // Expected abort rejection
          }
        }

        const previousValue = state.value;
        state.value = undefined;

        if (previousValue !== undefined && resource.release) {
          try {
            await Promise.resolve(resource.release(previousValue, context));
          } catch (releaseErr) {
            state.error =
              releaseErr instanceof FrnlFault
                ? releaseErr
                : new FrnlFault({
                    code: 'RESOURCE_RELEASE_FAILED',
                    message: releaseErr instanceof Error ? releaseErr.message : String(releaseErr),
                    cause: releaseErr,
                  });
            throw state.error;
          }
        }
      })();

      return state.inFlightReleasePromise;
    },
  };
}

export interface FrnlScope {
  readonly id: string;
  readonly parent?: FrnlScope;
  readonly signal: AbortSignal;
  readonly isDisposed: boolean;
  add<T>(resource: FrnlResource<T>): ResourceController<T>;
  createChildScope(id: string): FrnlScope;
  dispose(): Promise<void>;
  /** @internal */
  _registerChild?(child: FrnlScope): void;
  /** @internal */
  _removeChild?(child: FrnlScope): void;
}

export function createScope(id: string, parent?: FrnlScope): FrnlScope {
  if (parent && (parent.signal.aborted || parent.isDisposed)) {
    throw new FrnlFault({
      code: 'SCOPE_DISPOSED',
      message: `Cannot create child scope from disposed parent '${parent.id}'`,
    });
  }

  const controller = new AbortController();
  const resources = new Set<ResourceController<unknown>>();
  const childScopes = new Set<FrnlScope>();
  let isDisposed = false;
  let inFlightDisposePromise: Promise<void> | undefined;

  const scope: FrnlScope = {
    id,
    parent,
    signal: controller.signal,
    get isDisposed() {
      return isDisposed;
    },

    _registerChild(child: FrnlScope) {
      if (isDisposed) {
        void child.dispose();
      } else {
        childScopes.add(child);
      }
    },

    _removeChild(child: FrnlScope) {
      childScopes.delete(child);
    },

    add<T>(resource: FrnlResource<T>): ResourceController<T> {
      if (controller.signal.aborted || isDisposed) {
        throw new FrnlFault({
          code: 'SCOPE_DISPOSED',
          message: `Scope '${id}' has been disposed`,
        });
      }
      const resCtrl = createResourceController(resource, id);
      resources.add(resCtrl as ResourceController<unknown>);
      return resCtrl;
    },

    createChildScope(childId: string): FrnlScope {
      if (controller.signal.aborted || isDisposed) {
        throw new FrnlFault({
          code: 'SCOPE_DISPOSED',
          message: `Cannot create child scope from disposed parent '${id}'`,
        });
      }
      return createScope(childId, scope);
    },

    async dispose(): Promise<void> {
      if (isDisposed) {
        return;
      }
      if (inFlightDisposePromise) {
        return inFlightDisposePromise;
      }

      inFlightDisposePromise = (async () => {
        isDisposed = true;
        if (!controller.signal.aborted) {
          controller.abort();
        }

        // Notify parent to unregister this child to prevent memory leaks
        if (parent?._removeChild) {
          parent._removeChild(scope);
        }

        // Concurrently dispose all child scopes and release all owned resources
        const childPromises = [...childScopes].map((child) => child.dispose());
        const resourcePromises = [...resources].map((res) => res.release());

        childScopes.clear();
        resources.clear();

        await Promise.allSettled([...childPromises, ...resourcePromises]);
      })();

      return inFlightDisposePromise;
    },
  };

  if (parent?._registerChild) {
    parent._registerChild(scope);
  }

  if (parent) {
    parent.signal.addEventListener('abort', () => void scope.dispose(), { once: true });
  }

  return scope;
}