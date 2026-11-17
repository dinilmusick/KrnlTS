import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const builtins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
const portableExternalImports = new Set([
  '@dinilmusick/gutts/browser',
  '@dinilmusick/gutts/semantic-input',
  'react',
  'react/jsx-runtime',
  'zustand',
  'zustand/vanilla',
  'zod',
]);

const entries = [
  ['root', 'dist/index.js'],
  ['runtime', 'dist/runtime/index.js'],
  ['react', 'dist/react/index.js'],
];

function importsFrom(source) {
  const found = new Set();
  const patterns = [
    /\bimport\s*(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:\*\s+as\s+[\w$]+|\*|\{[^}]*\})\s+from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.add(match[1]);
  }
  return [...found];
}

function resolveLocal(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.js`, `${base}.mjs`, `${base}.cjs`, path.join(base, 'index.js')];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function inspectEntry(label, relativeEntry) {
  const entry = path.resolve(root, relativeEntry);
  assert.ok(fs.existsSync(entry), `Build output missing for ${label}: ${relativeEntry}; run pnpm build first`);
  const visited = new Set();
  const pending = [entry];
  const external = new Set();

  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    const source = fs.readFileSync(file, 'utf8');

    for (const specifier of importsFrom(source)) {
      assert.ok(!builtins.has(specifier), `${label} emitted graph imports Node builtin "${specifier}" from ${path.relative(root, file)}`);
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const resolved = resolveLocal(file, specifier);
        assert.ok(resolved, `Unresolved emitted relative import "${specifier}" from ${path.relative(root, file)}`);
        pending.push(resolved);
        continue;
      }
      if (specifier === '@dinilmusick/gutts/semantic-input') {
        assert.match(
          source,
          /import\s*\(\s*['"]@dinilmusick\/gutts\/semantic-input['"]\s*\)/,
          `${label} may load model-backed semantic input only through a lazy dynamic import`,
        );
        assert.doesNotMatch(
          source,
          /(?:from\s*|import\s*)['"]@dinilmusick\/gutts\/semantic-input['"]/,
          `${label} must not statically import model-backed semantic input into its Worker-safe graph`,
        );
      }
      external.add(specifier);
      assert.ok(
        portableExternalImports.has(specifier),
        `${label} emitted graph contains an unapproved external dependency "${specifier}" in ${path.relative(root, file)}`,
      );
      if (label === 'runtime') {
        assert.ok(
          specifier !== 'react' && specifier !== 'react/jsx-runtime' && specifier !== '@dinilmusick/gutts/browser',
          'Headless runtime must not load React or the GutTS browser entry: ' + specifier,
        );
      }
      assert.ok(
        !specifier.startsWith('@ultrst-armada/frnlts/cli') &&
        !specifier.startsWith('@ultrst-armada/frnlts/validate') &&
        !specifier.startsWith('typescript') &&
        !specifier.startsWith('tsup'),
        `${label} runtime graph must not include CLI/build/validation tooling: ${specifier}`,
      );
    }
  }

  return {
    entry: relativeEntry,
    emittedModules: visited.size,
    externalImports: [...external].sort(),
  };
}

assert.equal(packageJson.name, '@ultrst-armada/frnlts');
assert.ok(
  packageJson.dependencies?.typescript,
  'The public /validate export requires TypeScript at runtime; keep it out of the browser/Worker emitted runtime graphs instead',
);
for (const tool of ['tsup', 'vitest', '@types/react', '@types/react-dom']) {
  assert.equal(
    packageJson.dependencies?.[tool],
    undefined,
    `Build/test/type declaration tool ${tool} must not be a production dependency`,
  );
  assert.ok(packageJson.devDependencies?.[tool], `Build/test tool ${tool} must remain a development dependency`);
}
const cliManifest = JSON.parse(fs.readFileSync(path.join(root, 'packages/cli/package.json'), 'utf8'));
assert.equal(cliManifest.dependencies?.['@types/node'], undefined, 'Node type declarations must not be a CLI runtime dependency');
assert.ok(cliManifest.devDependencies?.['@types/node'], 'Node type declarations belong in CLI development dependencies');

const results = entries.map(([label, entry]) => inspectEntry(label, entry));

const semanticInput = fs.readFileSync(path.join(root, 'src/runtime/semantic-input.ts'), 'utf8');
assert.match(
  semanticInput,
  /import\s+type\s+{[\s\S]*?}\s+from\s+['"]@dinilmusick\/gutts\/semantic-input['"]/,
  'Semantic input contracts must use the dedicated GutTS semantic-input type surface',
);
assert.doesNotMatch(
  semanticInput,
  /from\s+['"]@dinilmusick\/gutts(?:\/browser)?['"]/,
  'Semantic input must not statically import GutTS runtime implementations',
);
assert.doesNotMatch(
  semanticInput,
  /import\s*\(\s*['"]@dinilmusick\/gutts\/browser['"]/,
  'Semantic input type references must not point at the browser barrel that omits semantic-input declarations',
);
assert.equal(
  [...semanticInput.matchAll(/await\s+import\s*\(\s*['"]@dinilmusick\/gutts\/semantic-input['"]\s*\)/g)].length,
  2,
  'Model-backed semantic input must be loaded lazily only when its async APIs are invoked',
);

const declarationRoot = path.join(root, 'dist');
const declarationFiles = [];
function collectDeclarations(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collectDeclarations(file);
    else if (entry.isFile() && entry.name.endsWith('.d.ts')) declarationFiles.push(file);
  }
}
collectDeclarations(declarationRoot);
assert.ok(declarationFiles.length > 0, 'Build must emit public declaration files');

for (const file of declarationFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const specifier of importsFrom(source)) {
    assert.ok(!builtins.has(specifier), `Declaration graph imports Node builtin "${specifier}" from ${path.relative(root, file)}`);
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      assert.ok(
        portableExternalImports.has(specifier),
        `Declaration graph contains non-portable dependency "${specifier}" in ${path.relative(root, file)}`,
      );
      if (file.startsWith(path.join(declarationRoot, 'runtime') + path.sep)) {
        assert.ok(
          specifier !== 'react' && specifier !== 'react/jsx-runtime',
          'Headless runtime declarations must not depend on React: ' + specifier,
        );
      }
    }
  }
}

console.log(JSON.stringify({
  package: packageJson.name,
  checks: results,
  policy: 'Emitted root/runtime/React graphs contain only portable external imports and no Node builtins or tooling edges.',
}, null, 2));
