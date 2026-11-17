/**
 * @file kloks-boundary.test.ts
 * @description Invariant tests enforcing Section 5 of Canonical Orchestration Architecture:
 *
 * "5. Kloks clean boundary
 * Kloks is strictly a distribution / library layer for user-defined reusable code.
 * Kloks MUST NOT contain an execution engine, BullMQ, queues, workers, worker pools, dispatchers, or execution boundaries.
 * Importing Kloks must not start workers or create queues."
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Kloks Clean Distribution & Architectural Boundary', () => {
  it('Kloks root package.json has NO bullmq dependency', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
      ...(pkg.peerDependencies || {}),
    };

    expect(allDeps['bullmq']).toBeUndefined();
  });

  it('no subpackages in Kloks have bullmq in dependencies', () => {
    const packagesDir = path.resolve(__dirname, '../packages');
    const dirs = fs.readdirSync(packagesDir, { withFileTypes: true });

    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const pkgJsonPath = path.join(packagesDir, d.name, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const deps = { ...(pkg.dependencies || {}) };
        expect(deps['bullmq'], `Subpackage ${d.name} must not depend on bullmq`).toBeUndefined();
      }
    }
  });

  it('Kloks does NOT export execution engine, workers, or worker pools', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const exports = pkg.exports || {};

    expect(exports['./backend/execution']).toBeUndefined();
    expect(exports['./backend/worker']).toBeUndefined();
    expect(exports['./state-graph/execution']).toBeUndefined();
  });

  it('importing Kloks services and orchestrations does NOT instantiate queues or background workers', async () => {
    // Import services and orchestrations
    const services = await import('../packages/services/src/index.js');
    const orchestrations = await import('../packages/orchestrations/src/index.js');

    expect(services.ServiceAFacade).toBeDefined();
    expect(orchestrations.OrchestratorADefinition).toBeDefined();
    expect(orchestrations.OrchestratorBDefinition).toBeDefined();

    // Verify no execution or worker symbols are exposed on orchestrations
    expect((orchestrations.OrchestratorADefinition as any).execute).toBeUndefined();
    expect((orchestrations as any).WorkerExecutionBoundary).toBeUndefined();
    expect((orchestrations as any).workerExecutionBoundary).toBeUndefined();
    expect((orchestrations as any).backendFacade).toBeUndefined();
    expect((orchestrations as any).ExecutableBackendFacade).toBeUndefined();
  }, 30000);
});
