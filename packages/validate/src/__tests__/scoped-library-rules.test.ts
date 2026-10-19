import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KrnlValidatorEngine } from '../KrnlValidatorEngine.js';

describe('KrnlTS Scoped Library Rules and Promotion Detection', () => {
  it('accepts service-prefixed contextual assets in service-local libraries', () => {
    const root = mkdtempSync(join(tmpdir(), 'krnl-scoped-lib-valid-'));
    try {
      const libDir = join(root, 'src', 'backend', 'services', 'Auth', 'libraries', 'AuthTokens');
      mkdirSync(libDir, { recursive: true });
      writeFileSync(join(libDir, 'manifest.json'), JSON.stringify({ name: 'AuthTokens' }));

      const code = `
export interface AuthUserToken {
  userId: string;
  expiresAt: number;
}

export function authValidateUserToken(token: AuthUserToken): boolean {
  return token.expiresAt > Date.now();
}

export const authDefaultTokenExpiry: number = 3600;
`;
      writeFileSync(join(libDir, 'tokens.ts'), code);

      const report = new KrnlValidatorEngine(root).validateAll();
      expect(report.valid).toBe(true);
      expect(report.errors).toHaveLength(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects contextual assets missing the service name in their identifiers', () => {
    const root = mkdtempSync(join(tmpdir(), 'krnl-scoped-lib-invalid-'));
    try {
      const libDir = join(root, 'src', 'backend', 'services', 'Auth', 'libraries', 'AuthTokens');
      mkdirSync(libDir, { recursive: true });
      writeFileSync(join(libDir, 'manifest.json'), JSON.stringify({ name: 'AuthTokens' }));

      const code = `
export interface UserSession {
  sessionId: string;
}

export function validateSession(session: UserSession): boolean {
  return session.sessionId.length > 0;
}
`;
      writeFileSync(join(libDir, 'session.ts'), code);

      const report = new KrnlValidatorEngine(root).validateAll();
      expect(report.valid).toBe(false);
      const namingErrors = report.errors.filter((e) => e.ruleId === 'krnl/service-library-asset-naming');
      expect(namingErrors.length).toBeGreaterThan(0);
      expect(namingErrors.some((e) => e.message.includes("Service library interface 'UserSession'"))).toBe(true);
      expect(namingErrors.some((e) => e.message.includes("Service library asset 'validateSession'"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('detects completely generic functions as PROMOTABLE without naming violations', () => {
    const root = mkdtempSync(join(tmpdir(), 'krnl-scoped-lib-promotable-'));
    try {
      const libDir = join(root, 'src', 'backend', 'services', 'Billing', 'libraries', 'MathUtils');
      mkdirSync(libDir, { recursive: true });
      writeFileSync(join(libDir, 'manifest.json'), JSON.stringify({ name: 'MathUtils' }));

      // Pure generic functions with no contextual domain types
      const code = `
export function clamp<T extends number>(value: T, min: T, max: T): T {
  return (value < min ? min : value > max ? max : value) as T;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
`;
      writeFileSync(join(libDir, 'pureMath.ts'), code);

      const report = new KrnlValidatorEngine(root).validateAll();
      expect(report.valid).toBe(true);
      expect(report.errors).toHaveLength(0);

      expect(report.promotableAssets).toBeDefined();
      expect(report.promotableAssets?.length).toBe(2);
      expect(report.promotableAssets?.some((a) => a.name === 'clamp' && a.target === 'GutTS')).toBe(true);
      expect(report.promotableAssets?.some((a) => a.name === 'chunk' && a.target === 'GutTS')).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
