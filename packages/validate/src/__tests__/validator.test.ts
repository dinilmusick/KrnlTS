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

  it('ignores dist, node_modules, and .git directories during source collection', () => {
    const root = mkdtempSync(join(tmpdir(), 'krnl-validator-'));
    try {
      mkdirSync(join(root, 'dist'), { recursive: true });
      mkdirSync(join(root, 'node_modules'), { recursive: true });
      mkdirSync(join(root, '.git'), { recursive: true });
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'dist', 'bundle.ts'), 'export const invalid = true;\n');
      writeFileSync(join(root, 'node_modules', 'dep.ts'), 'export const dep = 1;\n');
      writeFileSync(join(root, '.git', 'HEAD.ts'), 'export const git = 1;\n');
      writeFileSync(join(root, 'src', 'valid.ts'), 'export const valid = 1;\n');

      const report = new KrnlValidatorEngine(root).validateAll();
      expect(report.totalFiles).toBe(1);
      expect(report.valid).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags files exceeding the 200-line purity limit', () => {
    const longContent = Array.from({ length: 205 }, (_, i) => `export const v${i} = ${i};`).join('\n') + '\n';
    const root = fixture(longContent);
    try {
      const report = new KrnlValidatorEngine(root).validateAll();
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.ruleId === 'krnl/file-line-limit')).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('validates Orchestration purity and flags procedural violations and direct library imports', () => {
    const validOrch = `
import { Orchestration } from '@ultrst-armada/krnl-core';
export class ValidOrch extends Orchestration {
  constructor() {
    super({ id: 'ValidOrch' });
    this.flow('checkout')
      .thenFunctionality('ProcessPayment')
      .thenOrchestration('AuditOrch', 'log')
      .register();
  }
}
`;
    const rootValid = fixture(validOrch);
    try {
      const report = new KrnlValidatorEngine(rootValid).validateAll();
      expect(report.valid).toBe(true);
    } finally {
      rmSync(rootValid, { recursive: true, force: true });
    }

    const invalidOrch = `
import { Orchestration } from '@ultrst-armada/krnl-core';
import { helper } from '../libraries/MathConcepts/functions.js';
export class BadOrch extends Orchestration {
  constructor() {
    super({ id: 'BadOrch' });
    for (let i = 0; i < 10; i++) {}
  }
  customHelper() {
    return 1;
  }
}
`;
    const rootInvalid = fixture(invalidOrch);
    try {
      const report = new KrnlValidatorEngine(rootInvalid).validateAll();
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.ruleId === 'krnl/orchestration-purity')).toBe(true);
      expect(report.errors.some((e) => e.ruleId === 'krnl/orchestration-no-libraries')).toBe(true);
    } finally {
      rmSync(rootInvalid, { recursive: true, force: true });
    }
  });
});

