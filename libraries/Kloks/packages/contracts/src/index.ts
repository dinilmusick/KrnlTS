/**
 * @file index.ts
 * @description Kloks Canonical Contracts Package entry point.
 * Exports public schemas, metadata, snapshots, diffing, and compatibility validation.
 */

export * from './schemas.js';
export * from './surface.js';
export * from './snapshot.js';
export * from './serviceUiSchema.js';
export * from './monacoIdeSchema.js';
export * from './uiAuthoringSchema.js';

import { createKloksSnapshot } from './snapshot.js';
import { KLOKS_PUBLIC_SURFACE, QWNSR_REQUIRED_SURFACE, validateConsumerSurfaceCompatibility } from './surface.js';

export const KLOKS_CANONICAL_CONTRACT = {
  package: '@ultrst-armada/kloks',
  version: '1.0.2',
  getSnapshot: () => createKloksSnapshot('1.0.2', KLOKS_PUBLIC_SURFACE),
  validateCompatibility: (consumerSymbols?: string[]) =>
    validateConsumerSurfaceCompatibility(consumerSymbols ?? QWNSR_REQUIRED_SURFACE, KLOKS_PUBLIC_SURFACE),
};
export * from './uiAuthoringArtifactSchema.js';
