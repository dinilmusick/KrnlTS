import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) files.push(path);
  }
}

await walk(join(root, 'src/frontend'));

const forbiddenNames = new Set([
  'WorkspaceTilesMenu.tsx', 'WorkspaceTileCard.tsx', 'WorkspaceGate.tsx',
  'LoginModal.tsx', 'LoginErrorBox.tsx', 'LoginForm.tsx',
]);
const violations = [];

for (const path of files) {
  const rel = path.replaceAll('\\', '/');
  const base = rel.split('/').pop();
  const source = await readFile(path, 'utf8');
  if (forbiddenNames.has(base)) {
    violations.push(rel + ': local auth/workspace UI component is forbidden; use Floks.');
  }
  if (/src\/frontend\/components\/(Workspace|auth)\//.test(rel) &&
      /from ['"][.]{1,2}\/.*(WorkspaceTilesMenu|WorkspaceGate|LoginModal|LoginErrorBox)|from ['"]@\/.*(WorkspaceTilesMenu|WorkspaceGate|LoginModal|LoginErrorBox)/.test(source)) {
    violations.push(rel + ': imports a local workspace/auth UI component.');
  }
}

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const appNameByPackage = {
  aiko: 'aiko',
  '@ultrst-armada/kone': 'kone',
  'srkl-engine': 'srkl',
};
const appName = appNameByPackage[packageJson.name];
if (!appName) {
  violations.push('package.json: unsupported application identity "' + packageJson.name + '".');
}

const required = {
  aiko: [
    ['src/frontend/pages/menus/workspaces/page.tsx', '@ultrst-armada/floks'],
    ['src/frontend/pages/auth/page.tsx', '@ultrst-armada/floks'],
  ],
  kone: [
    ['src/frontend/pages/main/page.tsx', '@ultrst-armada/floks/ui'],
    ['src/frontend/App.tsx', '@ultrst-armada/floks/auth'],
  ],
  srkl: [
    ['src/frontend/components/AppShell/AppLayout.tsx', '@ultrst-armada/floks/ui'],
    ['src/frontend/components/common/WelcomePage.tsx', '@ultrst-armada/floks/ui'],
  ],
};

if (appName) {
  for (const [relative, marker] of required[appName]) {
    const target = join(root, relative);
    try {
      const source = await readFile(target, 'utf8');
      if (!source.includes(marker)) {
        violations.push(relative + ': canonical Floks boundary missing (' + marker + ').');
      }
    } catch (error) {
      if (error?.code === 'ENOENT') violations.push(relative + ': required canonical boundary file is missing.');
      else throw error;
    }
  }
}

if (violations.length) {
  console.error('Canonical auth/workspace UI boundary FAILED');
  for (const violation of violations) console.error(' - ' + violation);
  process.exit(1);
}
console.log('Canonical auth/workspace UI boundary passed for ' + appName + '.');
