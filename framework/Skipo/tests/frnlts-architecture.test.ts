import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '..');

const FORBIDDEN_LEGACY_TERMS = [
  'FrnlSlot',
  'FrnlComposite',
  'occupantKind',
  'occupantId',
  'slotCollection',
  'registerSlot',
  'replaceSlotOccupant',
  'setEntityBounds',
  'VisualAsset',
  'visualAssetSchema',
];

describe('current FrnlTS architecture boundary', () => {
  it('keeps the frontend free of backend implementation imports', () => {
    const frontendFiles = execFileSync(
      'find',
      ['src/frontend', '-type', 'f', '(', '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.js', '-o', '-name', '*.jsx', ')'],
      { cwd: repoRoot, encoding: 'utf8' },
    ).trim().split('\n').filter(Boolean);

    const violations = frontendFiles.filter((relativePath) => {
      const content = readFileSync(join(repoRoot, relativePath), 'utf8');
      return (
        content.includes("SkipoBackend") ||
        content.includes("../backend/") ||
        content.includes("./backend/")
      );
    });

    expect(violations).toEqual([]);
  });

  it('contains no deleted Slots, Bounds, occupants, or visual-asset integration', () => {
    const roots = ['src', 'generators', 'mutators', 'scaffolds'];
    const files = execFileSync(
      'find',
      [...roots, '-type', 'f', '(', '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.py', '-o', '-name', '*.js', '-o', '-name', '*.jsx', ')'],
      { cwd: repoRoot, encoding: 'utf8' },
    ).trim().split('\n').filter(Boolean);

    const violations: string[] = [];
    for (const relativePath of files) {
      const content = readFileSync(join(repoRoot, relativePath), 'utf8');
      for (const term of FORBIDDEN_LEGACY_TERMS) {
        if (content.includes(term)) {
          violations.push(`${relativePath}: ${term}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('concept-library generator', () => {
  it('emits valid JSON and deterministic generated structure', () => {
    const target = mkdtempSync(join(tmpdir(), 'skipo-concept-generator-'));
    const generator = join(repoRoot, 'generators', '14_concept_library_generator.py');

    try {
      const args = [
        generator,
        target,
        '--name', 'audio_graph',
        '--params', JSON.stringify({ app_name: 'TestApp' }),
        '--json',
        '--force',
      ];

      const first = JSON.parse(execFileSync('python3', args, {
        cwd: repoRoot,
        encoding: 'utf8',
      }));

      expect(first.success).toBe(true);
      expect(first.generator_id).toBe('14_concept_library_generator');
      expect(first.file_count).toBe(4);

      const generatedPaths = first.files.map((file: { relative_path: string }) => file.relative_path);
      expect(generatedPaths).toEqual([
        'src/libraries/audio_graph_concepts/AudioGraphTypes.ts',
        'src/libraries/audio_graph_concepts/audioGraphTransform.ts',
        'src/libraries/audio_graph_concepts/audio_graph_concepts.ts',
        'src/libraries/TestAppConcepts.ts',
      ]);

      const generatedContents = generatedPaths.map((path: string) =>
        readFileSync(join(target, path), 'utf8'),
      );

      expect(generatedContents[2]).toContain("export * from './AudioGraphTypes.js';");
      expect(generatedContents[2]).toContain("export { audioGraphTransform } from './audioGraphTransform.js';");
      expect(generatedContents[3]).toContain("./audio_graph_concepts/audio_graph_concepts.js");

      const second = JSON.parse(execFileSync('python3', args, {
        cwd: repoRoot,
        encoding: 'utf8',
      }));

      expect(second.success).toBe(true);
      expect(second.files.map((file: { relative_path: string }) => file.relative_path))
        .toEqual(generatedPaths);

      const regeneratedContents = generatedPaths.map((path: string) =>
        readFileSync(join(target, path), 'utf8'),
      );
      expect(regeneratedContents).toEqual(generatedContents);
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });
});

describe('canonical Skipo frontend page architecture', () => {
  it('contains only pages and components under the frontend plane', () => {
    const frontendEntries = execFileSync('find', ['src/frontend', '-mindepth', '1', '-maxdepth', '1', '-type', 'd'], { cwd: repoRoot, encoding: 'utf8' })
      .trim().split('\n').filter(Boolean).map((p) => p.replace(/^src\/frontend\//, '')).sort();
    expect(frontendEntries).toEqual(['components', 'pages']);
    expect(() => readFileSync(join(repoRoot, 'src/frontend-state/store.ts'), 'utf8')).toThrow();
  });

  it('requires pages to import UI through the components facade', () => {
    const page = readFileSync(join(repoRoot, 'src/frontend/pages/home/page.tsx'), 'utf8');
    expect(page).toContain("from '../../components/components.js'");
    expect(page).not.toContain('@ultrst-armada/floks/');
    const facade = readFileSync(join(repoRoot, 'src/frontend/components/components.ts'), 'utf8');
    expect(facade).toContain("export { LuthAuthPage } from '@ultrst-armada/floks/auth';");
  });

  it('routes App.tsx to a page instead of composing UI directly', () => {
    const app = readFileSync(join(repoRoot, 'src/frontend/App.tsx'), 'utf8');
    expect(app).toContain("./pages/home/page.js");
    expect(app).not.toContain('@ultrst-armada/floks/');
    expect(app).not.toContain('useState(');
  });
});

describe('Skipo Frnl CLI integration', () => {
  it('uses the canonical Frnl CLI for page generation, orchestration generation, and validation', () => {
    const createPage = readFileSync(join(repoRoot, 'scripts/create_page.py'), 'utf8');
    const createOrchestration = readFileSync(join(repoRoot, 'scripts/create_orchestration.py'), 'utf8');
    const validate = readFileSync(join(repoRoot, 'scripts/validate_frnl.py'), 'utf8');
    for (const source of [createPage, createOrchestration, validate]) {
      expect(source).toContain('["pnpm", "exec", "frnl"');
      expect(source).not.toContain('../FrnlTS');
      expect(source).not.toContain('@ultrst-armada/frnlts-cli');
      expect(source).toContain('"frnl"');
    }
  });
});

describe('Skipo page orchestration validation', () => {
  it('accepts a page with a facade-backed page and valid orchestration', () => {
    const target = mkdtempSync(join(tmpdir(), 'skipo-page-valid-'));
    mkdirSync(join(target, 'src/frontend/pages/home/orchestrations'), { recursive: true });
    fs.mkdirSync(join(target, 'src/frontend/components'), { recursive: true });
    writeFileSync(join(target, 'src/frontend/components/components.ts'), 'export {};');
    fs.writeFileSync(join(target, 'src/frontend/pages/home/page.tsx'), "import { FrnlPage } from '../../components/components.js';\nexport function Home() { return <FrnlPage />; }");
    fs.writeFileSync(join(target, 'src/frontend/pages/home/orchestrations/Save.ts'), "import { defineFrnlOrchestration } from '@ultrst-armada/frnlts';\nexport const Save = defineFrnlOrchestration({ id: 'home.Save', name: 'Save', setup: () => undefined });");
    const validator = join(repoRoot, 'checklists/01_structure_governance.py');
    const result = execFileSync('python3', [validator, target, '--json'], { encoding: 'utf8' });
    expect(JSON.parse(result).overall_passed ?? JSON.parse(result).passed).toBe(true);
  });

  it('rejects a frontend state directory and orphan orchestration', () => {
    const target = mkdtempSync(join(tmpdir(), 'skipo-page-invalid-'));
    fs.mkdirSync(join(target, 'src/frontend/frontend-state'), { recursive: true });
    fs.mkdirSync(join(target, 'src/frontend/components'), { recursive: true });
    fs.mkdirSync(join(target, 'src/frontend/pages/home/orchestrations'), { recursive: true });
    fs.writeFileSync(join(target, 'src/frontend/components/components.ts'), 'export {};');
    fs.writeFileSync(join(target, 'src/frontend/pages/home/page.tsx'), 'export function Home() { return null; }');
    fs.writeFileSync(join(target, 'src/frontend/pages/home/orchestrations/Bad.ts'), 'export const Bad = 1;');
    const validator = join(repoRoot, 'checklists/01_structure_governance.py');
    expect(() => execFileSync('python3', [validator, target], { encoding: 'utf8' })).toThrow();
  });
});
