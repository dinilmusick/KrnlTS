import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Aiko workspace UI boundary', () => {
  it('has no app-local workspace menu or creation implementation', () => {
    expect(() => readFileSync('src/frontend/components/workspace/WorkspaceTilesMenu.tsx', 'utf8')).toThrow();
    expect(() => readFileSync('src/frontend/components/workspace/WorkspaceCreateModal.tsx', 'utf8')).toThrow();
    expect(() => readFileSync('src/frontend/components/workspace/WorkspaceTileCard.tsx', 'utf8')).toThrow();
    expect(() => readFileSync('src/frontend/components/workspace/StorageOptionTiles.tsx', 'utf8')).toThrow();
  });
  it('passes canonical storage options and policy to Floks', () => {
    const page = readFileSync('src/frontend/pages/menus/workspaces/page.tsx', 'utf8');
    const app = readFileSync('src/frontend/App.tsx', 'utf8');
    expect(page).toContain('storageOptions={storageOptions}');
    expect(page).toContain("providers: ['google_drive', 'backblaze_b2']");
    expect(app).toContain('storageOptions={authWs.storageConnections}');
  });
});
