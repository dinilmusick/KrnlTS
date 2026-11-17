import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Skipo ecosystem session provenance safety', () => {
  const script = fs.readFileSync(path.resolve(__dirname, '../scripts/ecosystem_sync.py'), 'utf-8');
  const createPr = script.slice(script.indexOf('def create_pr('), script.indexOf('\ndef end_session(', script.indexOf('def create_pr(')));
  it('validates the originating immutable commit before any library push', () => {
    const validateAt = createPr.indexOf('valid immutable app commit SHA');
    const addAt = createPr.indexOf('run(["git", "add", "-A"], cwd=path)');
    const pushAt = createPr.indexOf('run(["git", "push", "-u", "origin", branch], cwd=path)');
    expect(validateAt).toBeGreaterThanOrEqual(0);
    expect(addAt).toBeGreaterThan(validateAt);
    expect(pushAt).toBeGreaterThan(addAt);
    expect(createPr).toContain('re.fullmatch(r"[0-9a-fA-F]{40}", app_commit)');
  });
  it('validates canonical target identity and Skipo session branch before pushing', () => {
    expect(createPr).toContain('library branch is not a Skipo session branch');
    expect(createPr).toContain('library repository does not match the canonical target');
    expect(createPr).toContain('branch.startswith("skipo/")');
    expect(createPr).toContain('state["libraries"][key].get("repository") != spec["repo"]');
  });
  it('removes local clones after a merged reconciliation even when session state was removed by Git', () => {
    const cleanup = script.slice(script.indexOf('def cleanup('), script.indexOf('\ndef main(', script.indexOf('def cleanup(')));
    expect(cleanup).toContain('if not state:');
    expect(cleanup).toContain('Cannot remove local library clones while package.json still uses file: dependencies');
    expect(cleanup).toContain('"reconciled": True');
    expect(cleanup).toContain('shutil.rmtree(spec["path"])');
  });
  it('refuses filesystem cleanup if the app is dirty or local dependency references remain', () => {
    const cleanup = script.slice(script.indexOf('def cleanup('), script.indexOf('\ndef main(', script.indexOf('def cleanup(')));
    expect(cleanup).toContain('Refusing ecosystem cleanup while the application workspace is dirty.');
    expect(cleanup).toContain('startswith("file:.skipo/libraries/")');
    expect(cleanup).toContain('Refusing cleanup of dirty {key} workspace');
  });
  it('verifies reconciliation both before and after merge using a dedicated CI workflow', () => {
    const workflow = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/ecosystem-reconciliation.yml'), 'utf8');
    expect(workflow).toContain('types: [opened, synchronize, reopened, closed]');
    expect(workflow).toContain("startsWith(github.event.pull_request.head.ref, 'krusbl/reconcile-ecosystem-')");
    expect(workflow).toContain("github.event.pull_request.merged == true");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain('Ecosystem reconciliation completed');
  });
});
