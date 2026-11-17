/**
 * @file useBackend.ts
 * @description React Context Provider and hooks for accessing BackendClient declaratively.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { BackendClient, DomainProxy } from '../connectivity/BackendClient.js';
import { BackendResolver } from '../connectivity/BackendResolver.js';
import { FrontendSession } from '../connectivity/FrontendSession.js';

export type BackendClientInstance = BackendClient & Record<string, DomainProxy>;

export interface BackendProviderProps {
  client?: BackendClientInstance;
  resolver?: BackendResolver;
  session?: FrontendSession;
  children: React.ReactNode;
}

const BackendContext: React.Context<BackendClientInstance | null> =
  typeof createContext === 'function' ? createContext<BackendClientInstance | null>(null) : (null as any);

export function BackendProvider({ client, resolver, session, children }: BackendProviderProps) {
  const activeClient = useMemo(() => {
    if (client) return client;
    if (resolver) {
      return new BackendClient({ resolver, session }) as BackendClientInstance;
    }
    throw new Error('[BackendProvider] Either a "client" or a "resolver" must be provided.');
  }, [client, resolver, session]);

  return React.createElement(BackendContext.Provider, { value: activeClient }, children);
}

export function useBackend(): BackendClientInstance {
  const client = useContext(BackendContext);
  if (!client) {
    throw new Error('[useBackend] useBackend must be used within a <BackendProvider>.');
  }
  return client;
}

export const useBackendClient = useBackend;
