import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('upstream dependency sync workflow', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/dependency-sync.yml', import.meta.url),
    'utf8',
  );

  it('proposes upstream updates as a pull request instead of mutating main', () => {
    expect(workflow).toContain('peter-evans/create-pull-request@v7');
    expect(workflow).toContain('branch: automation/upstream-dependency-sync');
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).not.toContain('git push origin HEAD:main');
    expect(workflow).not.toContain('[skip ci]');
  });

  it('validates package updates before opening or updating the PR', () => {
    const buildAt = workflow.indexOf('run: pnpm run build');
    const typecheckAt = workflow.indexOf('run: pnpm run typecheck');
    const testAt = workflow.indexOf('run: pnpm run test');
    const prAt = workflow.indexOf('uses: peter-evans/create-pull-request@v7');
    expect(buildAt).toBeGreaterThanOrEqual(0);
    expect(typecheckAt).toBeGreaterThan(buildAt);
    expect(testAt).toBeGreaterThan(typecheckAt);
    expect(prAt).toBeGreaterThan(testAt);
  });

  it('requires an explicit token for automated pull request creation', () => {
    expect(workflow).toContain('secrets.ECOSYSTEM_SYNC_TOKEN');
    expect(workflow).not.toContain('secrets.ECOSYSTEM_SYNC_TOKEN || secrets.GITHUB_TOKEN');
    expect(workflow).toContain('Verify dependency PR token is configured');
    expect(workflow).toContain('Contents and Pull requests read/write access');
  });

  it('tracks the upstream packages in the ecosystem dependency stream', () => {
    expect(workflow).toContain('@dinilmusick/gutts');
    expect(workflow).toContain('@ultrst-armada/krnl');
    expect(workflow).toContain('@ultrst-armada/frnlts');
    expect(workflow).toContain('@ultrst-armada/kloks');
    expect(workflow).toContain('@ultrst-armada/floks');
    expect(workflow).toContain('*/15 * * * *');
    expect(workflow).toContain('repository_dispatch:');
    expect(workflow).toContain('upstream-package-published');
  });
});
