/**
 * @file concept-libraries.test.ts
 * @description Verifies Skipo App-Level Concept Libraries architecture in src/libraries/:
 * 1. Folders follow the <library-name>_concepts/ pattern.
 * 2. Each contained file houses a single code asset (data definition or pure function).
 * 3. The <library-name>_concepts.ts facade aggregates and exposes all contained assets.
 * 4. The root <app_name>Concepts.ts (SkipoConcepts.ts) aggregates all concept facades.
 * 5. Both backend services and frontend components can consume concepts seamlessly.
 */

import { describe, it, expect } from 'vitest';
import {
  SkipoConcepts,
  composition_concepts,
  createCompositionManifest,
  validateCompositionIntegrity,
  type AppCompositionDescriptor,
} from '../src/libraries/index.js';

describe('Skipo App-Level Concept Libraries Architecture (src/libraries/)', () => {
  it('exposes single-asset data definitions and pure functions through library facade', () => {
    expect(composition_concepts).toBeDefined();
    expect(typeof composition_concepts.createCompositionManifest).toBe('function');
    expect(typeof composition_concepts.validateCompositionIntegrity).toBe('function');

    const manifest: AppCompositionDescriptor = composition_concepts.createCompositionManifest(
      'skipo-studio',
      'Skipo Studio',
      ['serviceA', 'serviceB'],
      ['composition_concepts']
    );

    expect(manifest.appId).toBe('skipo-studio');
    expect(manifest.appName).toBe('Skipo Studio');
    expect(manifest.planes.libraries).toBe('src/libraries');
    expect(manifest.activeServices).toEqual(['serviceA', 'serviceB']);

    const validation = composition_concepts.validateCompositionIntegrity(manifest);
    expect(validation.valid).toBe(true);
    expect(validation.score).toBe(100);
    expect(validation.errors).toHaveLength(0);
  });

  it('aggregates all concept facades into the root SkipoConcepts main facade', () => {
    expect(SkipoConcepts).toBeDefined();
    expect(SkipoConcepts.composition_concepts).toBe(composition_concepts);
    expect(SkipoConcepts.composition).toBe(composition_concepts);

    // Direct named exports are also re-exported
    expect(typeof createCompositionManifest).toBe('function');
    expect(typeof validateCompositionIntegrity).toBe('function');
  });

  it('allows backend services to consume app-level concepts without circular dependencies', () => {
    // Simulate backend service utilizing SkipoConcepts
    const backendDescriptor = SkipoConcepts.composition.createCompositionManifest(
      'backend-core',
      'Backend Core Service Cluster',
      ['auth', 'storage', 'workspace']
    );

    expect(backendDescriptor.planes.backend).toBe('src/backend');
    const integrity = validateCompositionIntegrity(backendDescriptor);
    expect(integrity.valid).toBe(true);
  });

  it('allows frontend components/state to consume app-level concepts', () => {
    // Simulate frontend UI utilizing SkipoConcepts for workspace metadata
    const frontendDescriptor = SkipoConcepts.composition.createCompositionManifest(
      'frontend-canvas',
      'Frontend Canvas View',
      ['nodeGraphEngine']
    );

    expect(frontendDescriptor.planes.frontend).toBe('src/frontend');
    expect(frontendDescriptor.conceptLibraries).toContain('composition_concepts');
  });

  it('catches invalid composition descriptors deterministically', () => {
    const invalidDescriptor = {
      appId: '',
      appName: '',
      version: '1.0.0',
      planes: {} as any,
      activeServices: [],
      conceptLibraries: [],
    };

    const res = composition_concepts.validateCompositionIntegrity(invalidDescriptor as any);
    expect(res.valid).toBe(false);
    expect(res.score).toBeLessThan(100);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
