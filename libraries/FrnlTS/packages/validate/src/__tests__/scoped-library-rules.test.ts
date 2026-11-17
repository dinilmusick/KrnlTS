import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateFrnlWorkspace } from '../index.js';

describe('FrnlTS Scoped Component Library Rules and Promotion Detection', () => {
  it('accepts component-prefixed contextual assets in component-local libraries', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-scoped-lib-valid-'));
    try {
      const compDir = path.join(tmp, 'components', 'Banner');
      const libDir = path.join(compDir, 'Libraries', 'helpers');
      const statesDir = path.join(compDir, 'States', 'Visible', 'Events');
      fs.mkdirSync(libDir, { recursive: true });
      fs.mkdirSync(statesDir, { recursive: true });

      fs.writeFileSync(path.join(compDir, 'Banner.tsx'), 'export function Banner() { return <div>Banner</div>; }\n');
      fs.writeFileSync(path.join(statesDir, 'Dismiss.ts'), 'export function Dismiss() { return 1; }\n');

      const code = `
export interface BannerConfig {
  variant: string;
}

export function formatBannerText(config: BannerConfig): string {
  return config.variant.toUpperCase();
}
`;
      fs.writeFileSync(path.join(libDir, 'bannerHelpers.ts'), code);

      const result = validateFrnlWorkspace(tmp);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('rejects contextual assets missing the component name in their identifiers', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-scoped-lib-invalid-'));
    try {
      const compDir = path.join(tmp, 'components', 'Banner');
      const libDir = path.join(compDir, 'Libraries', 'helpers');
      const statesDir = path.join(compDir, 'States', 'Visible', 'Events');
      fs.mkdirSync(libDir, { recursive: true });
      fs.mkdirSync(statesDir, { recursive: true });

      fs.writeFileSync(path.join(compDir, 'Banner.tsx'), 'export function Banner() { return <div>Banner</div>; }\n');
      fs.writeFileSync(path.join(statesDir, 'Dismiss.ts'), 'export function Dismiss() { return 1; }\n');

      const code = `
export interface ViewConfig {
  title: string;
}

export function formatView(config: ViewConfig): string {
  return config.title.trim();
}
`;
      fs.writeFileSync(path.join(libDir, 'view.ts'), code);

      const result = validateFrnlWorkspace(tmp);
      expect(result.passed).toBe(false);
      const namingErrors = result.errors.filter((e) => e.ruleId === 'frnl/component-library-asset-naming');
      expect(namingErrors.length).toBeGreaterThan(0);
      expect(namingErrors.some((e) => e.message.includes("Component library interface 'ViewConfig'"))).toBe(true);
      expect(namingErrors.some((e) => e.message.includes("Component library asset 'formatView'"))).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('detects completely generic functions as PROMOTABLE without naming violations', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-scoped-lib-promotable-'));
    try {
      const compDir = path.join(tmp, 'components', 'Modal');
      const libDir = path.join(compDir, 'Libraries', 'utils');
      const statesDir = path.join(compDir, 'States', 'Open', 'Events');
      fs.mkdirSync(libDir, { recursive: true });
      fs.mkdirSync(statesDir, { recursive: true });

      fs.writeFileSync(path.join(compDir, 'Modal.tsx'), 'export function Modal() { return <div>Modal</div>; }\n');
      fs.writeFileSync(path.join(statesDir, 'Close.ts'), 'export function Close() { return 1; }\n');

      const code = `
export function slugify(text: string): string {
  return text.toLowerCase().replace(/\\s+/g, '-');
}

export function truncateWords(input: string, wordCount: number): string {
  const words = input.split(' ');
  return words.length <= wordCount ? input : words.slice(0, wordCount).join(' ') + '...';
}
`;
      fs.writeFileSync(path.join(libDir, 'strings.ts'), code);

      const result = validateFrnlWorkspace(tmp);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);

      expect(result.promotableAssets).toBeDefined();
      expect(result.promotableAssets?.length).toBe(2);
      expect(result.promotableAssets?.some((a) => a.name === 'slugify' && a.target === 'GutTS')).toBe(true);
      expect(result.promotableAssets?.some((a) => a.name === 'truncateWords' && a.target === 'GutTS')).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
