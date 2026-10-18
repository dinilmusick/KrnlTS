import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KrnlValidatorEngine } from '../KrnlValidatorEngine.js';

function fixture(source: string): string {
  const root = mkdtempSync(join(tmpdir(), 'krnl-validator-'));
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src', 'index.ts'), source);
  return root;
}

describe('KrnlValidatorEngine', () => {
  it('returns a deterministic passing report for valid source', () => {
    const root = fixture('export const value = 1;\n');
    try {
      const report = new KrnlValidatorEngine(root).validateAll();
      expect(report.valid).toBe(true);
      expect(report.totalFiles).toBe(1);
      expect(report.errors).toHaveLength(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reports top-level backend route violations', () => {
    const root = fixture("const app = { get() {} }; app.get('/health', () => {});\n");
    try {
      const report = new KrnlValidatorEngine(root).validateAll();
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.ruleId === 'krnl/top-level-purity')).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('enforces manifest requirements for backend libraries', () => {
    const root = mkdtempSync(join(tmpdir(), 'krnl-validator-'));
    try {
      mkdirSync(join(root, 'src', 'backend', 'libraries'), { recursive: true });
      mkdirSync(join(root, 'src', 'backend', 'libraries', 'MissingManifest'));
      const report = new KrnlValidatorEngine(root).validateAll();
      expect(report.errors.some((e) => e.ruleId === 'krnl/concept-manifest-required')).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
