#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

const projectName = process.argv[2] || 'my-krnl-app';
const targetDir = path.resolve(process.cwd(), projectName);

console.log(`\n🚀 [create-krnl] Scaffolding new Krnl project in: ${targetDir}\n`);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Directory '${projectName}' already exists.`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.mkdirSync(path.join(targetDir, 'src', 'entities', 'App', 'functionalities', 'Hello', 'main_function'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'src', 'entities', 'App', 'functionalities', 'Hello', 'state_data'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'src', 'entities', 'App', 'functionalities', 'Hello', 'helper_functions'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'src', 'entities', 'App', 'functionalities', 'Hello', 'events'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'src', 'libraries'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'src', 'subapps'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'storage', 'media'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'docs'), { recursive: true });

// 1. package.json
fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify({
  name: projectName,
  version: '1.0.0',
  description: 'Full-stack application powered by Krnl',
  type: 'module',
  main: 'dist/index.js',
  scripts: {
    dev: 'krnl dev',
    build: 'krnl build',
    validate: 'krnl validate',
    watch: 'krnl watch --watch'
  },
  dependencies: {
    '@dinilmusick/krnl': '^1.0.0',
    '@dinilmusick/krnl-core': '^1.0.0',
    '@dinilmusick/krnl-ui': '^1.0.0'
  },
  devDependencies: {
    '@dinilmusick/krnl-cli': '^1.0.0',
    '@dinilmusick/krnl-validate': '^1.0.0',
    '@dinilmusick/eslint-plugin-krnl': '^1.0.0',
    typescript: '^5.7.3'
  }
}, null, 2));

// 2. tsconfig.json
fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ESNext',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    lib: ['ESNext', 'DOM'],
    strict: true,
    outDir: './dist',
    skipLibCheck: true,
    resolveJsonModule: true,
    paths: {
      '@/*': ['./src/*']
    }
  },
  include: ['src/**/*', 'krnl-magnetic.d.ts'],
  exclude: ['node_modules', 'dist']
}, null, 2));

// 3. krnl.json
fs.writeFileSync(path.join(targetDir, 'krnl.json'), JSON.stringify({
  name: projectName,
  version: '1.0.0',
  entry: 'src/entities/App/App.ts',
  port: 8080,
  backend: {
    controlPlane: 'sqlite',
    dataPlane: 'local'
  }
}, null, 2));

// 4. Root Entity (src/entities/App/App.ts)
fs.writeFileSync(path.join(targetDir, 'src', 'entities', 'App', 'App.ts'), `import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class App extends Entity {
  constructor() {
    super({
      id: 'App',
      version: '1.0.0',
      description: 'Root application entity'
    });
  }

  async boot(): Promise<void> {
    // Magnetic auto-discovery of functionalities and subapps
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default App;
`);

// 5. Example Functionality (Hello)
const helloDir = path.join(targetDir, 'src', 'entities', 'App', 'functionalities', 'Hello');
fs.writeFileSync(path.join(helloDir, 'HelloAtom.ts'), `export interface HelloInput {
  name?: string;
}

export interface HelloOutput {
  greeting: string;
  timestamp: number;
}
`);

fs.writeFileSync(path.join(helloDir, 'main_function', 'logic.ts'), `import { HelloInput, HelloOutput } from '../HelloAtom.js';
import { formatGreeting } from '../helper_functions/formatGreeting.js';

export const main = async (input: HelloInput, { state, entity }: any): Promise<HelloOutput> => {
  const greeting = formatGreeting(input.name || 'World');
  return {
    greeting,
    timestamp: Date.now()
  };
};
`);

fs.writeFileSync(path.join(helloDir, 'state_data', 'state.ts'), `export interface HelloState {
  callCount: number;
}

export const initialState: HelloState = {
  callCount: 0
};
`);

fs.writeFileSync(path.join(helloDir, 'helper_functions', 'formatGreeting.ts'), `export function formatGreeting(name: string): string {
  return \`Hello, \${name}! Welcome to Krnl.\`;
}
`);

// 6. Root Concept Library
fs.writeFileSync(path.join(targetDir, 'src', 'libraries', 'AppConcepts.ts'), `/**
 * @file AppConcepts.ts
 * @role component
 * @description Layer 0 pure domain concept library for App.
 */

export class AppConcepts {
  static pureTransform<T>(data: T): T {
    return data;
  }
}
`);

// 7. Docs HISTORY.md
fs.writeFileSync(path.join(targetDir, 'docs', 'HISTORY.md'), `# ${projectName} - Project History & Invariants

## Initial Scaffolding
- Initialized Krnl full-stack workspace.
- Configured 4-layer function purity gates.
- Setup App root entity and Hello functionality.
`);

console.log(`\n🎉 Project successfully scaffolded at: ${targetDir}`);
console.log(`\nTo get started:\n  cd ${projectName}\n  pnpm install\n  krnl dev\n`);
