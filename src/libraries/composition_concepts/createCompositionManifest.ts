/**
 * @file createCompositionManifest.ts
 * @description Single-asset pure function constructing an authentic AppCompositionDescriptor.
 * Conforms to L9 (Lines <= 200).
 */

import type { SkipoCompositionDescriptor } from './CompositionTypes.js';

export function createSkipoCompositionManifest(
  appId: string,
  appName: string,
  services: readonly string[] = [],
  conceptLibraries: readonly string[] = ['composition_concepts'],
  version = '1.0.0'
): SkipoCompositionDescriptor {
  if (!appId || typeof appId !== 'string') {
    throw new Error('[createSkipoCompositionManifest] appId must be a valid non-empty string.');
  }
  if (!appName || typeof appName !== 'string') {
    throw new Error('[createSkipoCompositionManifest] appName must be a valid non-empty string.');
  }

  return {
    appId: appId.trim().toLowerCase(),
    appName: appName.trim(),
    version,
    planes: {
      frontend: 'src/frontend',
      backend: 'src/backend',
      libraries: 'src/libraries',
      frontendState: 'src/frontend-state',
    },
    activeServices: [...services],
    conceptLibraries: [...conceptLibraries],
  };
}

export const createCompositionManifest = createSkipoCompositionManifest;
