import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

for (const relativePath of ['Skipo', 'src/libraries/skipo']) {
  if (fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Production build boundary violation: ${relativePath} exists`);
  }
}

const tsconfig = fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8');
const viteConfig = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
const adapter = fs.readFileSync(path.join(root, 'src/frontend/ui/skipoUi.tsx'), 'utf8');
const ecosystemTypes = fs.readFileSync(
  path.join(root, 'src/libraries/types/ecosystem.ts'),
  'utf8',
);

if (!tsconfig.includes('@skipo/ui') || !viteConfig.includes('@skipo/ui')) {
  throw new Error('Production build boundary violation: @skipo/ui compatibility resolution is not configured');
}

for (const exportName of [
  'SkipoThemeProvider',
  'useSkipoTheme',
  'BottomStripProvider',
  'useBottomStrip',
  'BottomStrip',
  'AppShell',
  'BaseButton',
  'BaseCard',
  'BaseInput',
  'BaseToggle',
]) {
  if (!adapter.includes(`export function ${exportName}`) && !adapter.includes(`export const ${exportName}`)) {
    throw new Error(`Production UI compatibility adapter is missing: ${exportName}`);
  }
}

for (const contract of ['toggleTheme', 'variant?: ButtonVariant', 'size?: ButtonSize', 'setInspectionText:']) {
  if (!adapter.includes(contract)) {
    throw new Error(`Production UI compatibility adapter contract is missing: ${contract}`);
  }
}

for (const contract of ['EcosystemServiceCategory', 'EcosystemAccount', 'AppAccountManifest']) {
  if (!ecosystemTypes.includes(contract)) {
    throw new Error(`SRKL ecosystem type contract is missing: ${contract}`);
  }
}

console.log('Production build boundary and compatibility contracts: PASS');
