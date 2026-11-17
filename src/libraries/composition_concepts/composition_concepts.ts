/**
 * @file composition_concepts.ts
 * @description Concept library facade for composition_concepts.
 * Provides unified access to all contained assets in composition_concepts/.
 * Conforms to L7 and L9 (Lines <= 200).
 */

export * from './CompositionTypes.js';
export { createCompositionManifest, createSkipoCompositionManifest } from './createCompositionManifest.js';
export { validateCompositionIntegrity, validateSkipoCompositionIntegrity } from './validateCompositionIntegrity.js';

import { createCompositionManifest, createSkipoCompositionManifest } from './createCompositionManifest.js';
import { validateCompositionIntegrity, validateSkipoCompositionIntegrity } from './validateCompositionIntegrity.js';

export const composition_concepts = {
  createCompositionManifest,
  createSkipoCompositionManifest,
  validateCompositionIntegrity,
  validateSkipoCompositionIntegrity,
} as const;

export default composition_concepts;
