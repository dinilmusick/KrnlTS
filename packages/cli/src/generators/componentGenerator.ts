import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ComponentGenerationOptions {
  states?: string[];
  events?: string[];
}

const DEFAULT_STATE = 'Idle';
const DEFAULT_EVENT = 'Click';

function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

export function generateComponent(name: string, projectRoot: string, options: ComponentGenerationOptions = {}): string {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) throw new Error('Component name must be PascalCase.');
  const states = [...new Set(options.states?.length ? options.states : [DEFAULT_STATE])];
  const events = [...new Set(options.events?.length ? options.events : [DEFAULT_EVENT])];
  const clickProp = events.includes('Click') ? ' onClick={frnl.events.Click}' : '';
  const componentDir = path.join(projectRoot, 'components', name);
  if (fs.existsSync(componentDir)) throw new Error(`Component already exists: ${componentDir}`);

  write(path.join(componentDir, `${name}.tsx`), `import type { ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { definition } from './definition.js';
import { eventHandlers } from './events.js';

export interface ${name}Props {
  id: string;
  store: StoreApi<any>;
  children?: ReactNode;
}

export function ${name}({ id, store, children }: ${name}Props) {
  const frnl = useFrnlComponent({
    id,
    definition,
    store,
    handlers: eventHandlers,
  });

  return (
    <div data-frnl-component="${name}" data-frnl-state={frnl.state}${clickProp}>
      {children}
    </div>
  );
}
`);

  const stateImports = states.map((state) => `import { ${state}State } from './States/${state}/state.js';`).join('\n');
  write(path.join(componentDir, 'definition.ts'), `import { defineFrnlComponent } from '@ultrst-armada/frnlts';
${stateImports}

export const definition = defineFrnlComponent({
  name: '${name}',
  states: {
${states.map((s) => `    ${s}: ${s}State,`).join('\n')}
  },
});
`);

  write(path.join(componentDir, 'events.ts'), states.flatMap((state) => events.map((event) => `import { ${state}${event} } from './States/${state}/Events/${event}.js';`)).join('\n') + `\n\nexport const eventHandlers = {
${states.flatMap((state) => events.map((event) => `  '${name}.${state}.${event}': ${state}${event},`)).join('\n')}
};
`);

  for (const state of states) {
    const eventDefs = events.map((event) => `    ${event}: { functionId: '${name}.${state}.${event}' },`).join('\n');
    write(path.join(componentDir, 'States', state, 'state.ts'), `import type { FrnlStateDefinition } from '@ultrst-armada/frnlts';

export const ${state}State: FrnlStateDefinition = {
  name: '${state}',
  visualParameters: {\n    opacity: 1,\n  },\n  events: {
${eventDefs}
  },
  phases: {
    attackPhase: { visualDefinition: { parameters: {} } },
    sustainPhase: { visualDefinition: { parameters: {} } },
    releasePhase: { visualDefinition: { parameters: {} } },
  },
};
`);
    write(path.join(componentDir, 'States', state, 'VisualParameters.ts'), `export const ${state}VisualParameters = {} as const;
`);
    write(path.join(componentDir, 'States', state, 'Events', '.gitkeep'), '');
    for (const event of events) {
      write(path.join(componentDir, 'States', state, 'Events', `${event}.ts`), `export function ${state}${event}(payload: unknown, context: import('@ultrst-armada/frnlts').FrnlEventContext): unknown {
  // Keep this state-specific event function intentionally small.
  // Delegate implementation to component Libraries.
  void payload;\n  void context;
}
`);
    }
  }

  for (const dir of ['functions', 'data', 'structs']) {
    write(path.join(componentDir, 'Libraries', dir, 'index.ts'), `// Component-local ${dir} library surface for ${name}.
`);
  }
  write(path.join(componentDir, 'Libraries', 'index.ts'), `export * from './functions/index.js';
export * from './data/index.js';
export * from './structs/index.js';
`);
  write(path.join(componentDir, 'index.ts'), `export { ${name} } from './${name}.js';
export { definition } from './definition.js';
`);

  return componentDir;
}

export function generateState(componentName: string, state: string, projectRoot: string): string {
  const componentDir = path.join(projectRoot, 'components', componentName);
  if (!fs.existsSync(componentDir)) throw new Error('Unknown Frnl component: ' + componentName);
  const stateDir = path.join(componentDir, 'States', state);
  fs.mkdirSync(path.join(stateDir, 'Events'), { recursive: true });
  write(path.join(stateDir, 'state.ts'), `import type { FrnlStateDefinition } from '@ultrst-armada/frnlts';

export const ${state}State: FrnlStateDefinition = {
  name: '${state}',
  visualParameters: {},
  events: {},
  phases: {
    attackPhase: { visualDefinition: { parameters: {} } },
    sustainPhase: { visualDefinition: { parameters: {} } },
    releasePhase: { visualDefinition: { parameters: {} } },
  },
};
`);
  write(path.join(stateDir, 'VisualParameters.ts'), `export const ${state}VisualParameters = {} as const;
`);
  const definitionFile = path.join(componentDir, 'definition.ts');
  const definition = fs.readFileSync(definitionFile, 'utf8');
  const withImport = definition.includes(`./States/${state}/state.js`)
    ? definition
    : definition.replace(/(import .*\n)+/, (imports) => imports + `import { ${state}State } from './States/${state}/state.js';\n`);
  const withState = withImport.includes(`${state}: ${state}State`)
    ? withImport
    : withImport.replace(/states: \{/, `states: {\n    ${state}: ${state}State,`);
  fs.writeFileSync(definitionFile, withState);
  return stateDir;
}

export function generateEvent(componentName: string, state: string, event: string, projectRoot: string): string {
  const componentDir = path.join(projectRoot, 'components', componentName);
  const eventFile = path.join(componentDir, 'States', state, 'Events', `${event}.ts`);
  if (!fs.existsSync(path.join(componentDir, componentName + '.tsx'))) throw new Error('Unknown Frnl component: ' + componentName);
  const stateFile = path.join(componentDir, 'States', state, 'state.ts');
  if (!fs.existsSync(stateFile)) generateState(componentName, state, projectRoot);
  fs.mkdirSync(path.dirname(eventFile), { recursive: true });
  write(eventFile, `export function ${state}${event}(payload: unknown, context: import('@ultrst-armada/frnlts').FrnlEventContext): unknown {
  void payload;
  void context;
}
`);
  let stateSource = fs.readFileSync(stateFile, 'utf8');
  if (!stateSource.includes(`${event}: { functionId:`)) {
    stateSource = stateSource.replace(/events: \{/, `events: {\n    ${event}: { functionId: '${componentName}.${state}.${event}' },`);
    fs.writeFileSync(stateFile, stateSource);
  }
  const eventsFile = path.join(componentDir, 'events.ts');
  let eventsSource = fs.existsSync(eventsFile) ? fs.readFileSync(eventsFile, 'utf8') : 'export const eventHandlers = {\n};\n';
  if (!eventsSource.includes(`./States/${state}/Events/${event}.js`)) {
    eventsSource = `import { ${state}${event} } from './States/${state}/Events/${event}.js';\n` + eventsSource;
  }
  if (!eventsSource.includes(`'${componentName}.${state}.${event}':`)) {
    eventsSource = eventsSource.replace(/export const eventHandlers = \{/,
      `export const eventHandlers = {\n  '${componentName}.${state}.${event}': ${state}${event},`);
  }
  fs.writeFileSync(eventsFile, eventsSource);
  return eventFile;
}

export function generateLibrary(componentName: string, category: 'functions' | 'data' | 'structs', name: string, projectRoot: string): string {
  const componentDir = path.join(projectRoot, 'components', componentName);
  if (!fs.existsSync(path.join(componentDir, componentName + '.tsx'))) throw new Error('Unknown Frnl component: ' + componentName);
  const file = path.join(componentDir, 'Libraries', category, name + '.ts');
  write(file, `export {};
`);
  const categoryIndex = path.join(componentDir, 'Libraries', category, 'index.ts');
  if (fs.existsSync(categoryIndex)) {
    let indexSource = fs.readFileSync(categoryIndex, 'utf8');
    const exportStatement = `export * from './${name}.js';\n`;
    if (!indexSource.includes(exportStatement)) {
      indexSource += exportStatement;
      fs.writeFileSync(categoryIndex, indexSource);
    }
  }
  return file;
}
