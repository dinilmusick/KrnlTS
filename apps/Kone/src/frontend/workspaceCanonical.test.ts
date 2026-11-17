import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Kone workspace UI boundary', () => {
  it('uses Floks WorkspaceGate with an explicit persistent-storage policy', () => {
    const source = readFileSync('src/frontend/pages/main/page.tsx', 'utf8');
    expect(source).toContain("import { WorkspaceGate } from '@ultrst-armada/floks/ui';");
    expect(source).toContain('storageService={storageService}');
    expect(source).toContain('createKloksWorkspaceStorageService');
    expect(source).toContain("providers: ['google_drive', 'backblaze_b2']");
    expect(source).not.toContain('WorkspaceCreateDialog');
    expect(source).not.toContain('WorkspaceTilesMenu');
  });
});
