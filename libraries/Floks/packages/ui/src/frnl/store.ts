import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  createFrnlFrontendApi,
  createFrnlDomMeasurementAdapter,
  installFrnlFrontendApi,
  createFrnlStore,
  type FrnlStore,
  type FrnlFrontendApi,
} from '@ultrst-armada/frnlts';

export type { FrnlStore };

/** Default canonical shared FrnlTS semantic store for Floks UI assets. */
export const floksFrnlStore: FrnlStore = createFrnlStore();

/** Canonical programmatic UI surface for the default Floks store. */
export const floksFrnlFrontendApi: FrnlFrontendApi = createFrnlFrontendApi(floksFrnlStore, {
  applicationId: 'floks',
  measurementAdapter: createFrnlDomMeasurementAdapter(),
});
installFrnlFrontendApi(floksFrnlFrontendApi);

export function getFloksFrnlStore(): FrnlStore {
  return floksFrnlStore;
}

export function getFloksFrnlFrontendApi(): FrnlFrontendApi {
  return floksFrnlFrontendApi;
}

const FrnlStoreContext = createContext<FrnlStore | null>(null);

export interface FrnlStoreProviderProps {
  store: FrnlStore;
  children: ReactNode;
  applicationId?: string;
  route?: string;
}

export const FrnlStoreProvider: React.FC<FrnlStoreProviderProps> = ({
  store,
  children,
  applicationId,
  route,
}) => {
  const api = useMemo(
    () => createFrnlFrontendApi(store, {
      applicationId,
      route,
      measurementAdapter: createFrnlDomMeasurementAdapter(),
    }),
    [store, applicationId, route],
  );

  React.useEffect(() => {
    installFrnlFrontendApi(api);
    return () => api.dispose();
  }, [api]);

  return React.createElement(FrnlStoreContext.Provider, { value: store }, children);
};

export function useFloksFrnlStore(): FrnlStore {
  const contextStore = useContext(FrnlStoreContext);
  return contextStore ?? floksFrnlStore;
}
