import * as fs from 'fs';
import * as path from 'path';

export async function runGenerate(type: string, name: string, parentEntity?: string, projectRoot: string = process.cwd()): Promise<void> {
  if (!name) {
    console.error('❌ Error: Resource name is required. Usage: krnl generate <entity|functionality|library|subapp> <Name> [ParentEntity]');
    process.exit(1);
  }

  switch (type.toLowerCase()) {
    case 'entity':
      generateEntity(name, projectRoot);
      break;
    case 'functionality':
      if (!parentEntity) {
        console.error('❌ Error: Parent entity name is required for functionality. Usage: krnl generate functionality <Name> <ParentEntity>');
        process.exit(1);
      }
      generateFunctionality(name, parentEntity, projectRoot);
      break;
    case 'library':
      generateLibrary(name, projectRoot);
      break;
    case 'subapp':
      generateSubApp(name, projectRoot);
      break;
    default:
      console.error(`❌ Unknown resource type '${type}'. Valid types: entity, functionality, library, subapp`);
      process.exit(1);
  }
}

function generateEntity(name: string, projectRoot: string) {
  const entityDir = path.join(projectRoot, 'src', 'entities', name);
  fs.mkdirSync(entityDir, { recursive: true });
  fs.mkdirSync(path.join(entityDir, 'functionalities'), { recursive: true });

  const entityFile = path.join(entityDir, `${name}.ts`);
  const content = `import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class ${name} extends Entity {
  constructor() {
    super({
      id: '${name}',
      version: '1.0.0',
      description: '${name} root entity'
    });
  }

  async boot(): Promise<void> {
    // 1. Local functionalities with UI must precede loadAll
    
    // 2. Discover magnetic functionalities, child entities, and subapps
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default ${name};
`;
  fs.writeFileSync(entityFile, content);
  console.log(`✅ Created Entity: src/entities/${name}/${name}.ts`);
}

function generateFunctionality(name: string, entityName: string, projectRoot: string) {
  const funcDir = path.join(projectRoot, 'src', 'entities', entityName, 'functionalities', name);
  fs.mkdirSync(path.join(funcDir, 'main_function'), { recursive: true });
  fs.mkdirSync(path.join(funcDir, 'state_data'), { recursive: true });
  fs.mkdirSync(path.join(funcDir, 'helper_functions'), { recursive: true });
  fs.mkdirSync(path.join(funcDir, 'events'), { recursive: true });

  // 1. Atom descriptor
  fs.writeFileSync(path.join(funcDir, `${name}Atom.ts`), `export interface ${name}Input {
  message?: string;
}

export interface ${name}Output {
  success: boolean;
  timestamp: number;
}
`);

  // 2. Main logic
  fs.writeFileSync(path.join(funcDir, 'main_function', 'logic.ts'), `import { ${name}Input, ${name}Output } from '../${name}Atom.js';
import { formatTimestamp } from '../helper_functions/formatTimestamp.js';

export const main = async (input: ${name}Input, { state, entity }: any): Promise<${name}Output> => {
  const timestamp = formatTimestamp();
  return {
    success: true,
    timestamp
  };
};
`);

  // 3. State
  fs.writeFileSync(path.join(funcDir, 'state_data', 'state.ts'), `export interface ${name}State {
  executionCount: number;
}

export const initialState: ${name}State = {
  executionCount: 0
};
`);

  // 4. Helper (Layer 1)
  fs.writeFileSync(path.join(funcDir, 'helper_functions', 'formatTimestamp.ts'), `export function formatTimestamp(): number {
  return Date.now();
}
`);

  console.log(`✅ Created Quad-Unit Functionality: src/entities/${entityName}/functionalities/${name}/`);
}

function generateLibrary(name: string, projectRoot: string) {
  const libDir = path.join(projectRoot, 'src', 'libraries');
  fs.mkdirSync(libDir, { recursive: true });

  const fileName = `${name}Concepts.ts`;
  fs.writeFileSync(path.join(libDir, fileName), `/**
 * @file ${fileName}
 * @role component
 * @description Layer 0 pure domain concept library for ${name}.
 */

export class ${name}Concepts {
  static pureTransform<T>(data: T): T {
    return data;
  }
}
`);
  console.log(`✅ Created Domain Concept Library: src/libraries/${fileName}`);
}

function generateSubApp(name: string, projectRoot: string) {
  const subappDir = path.join(projectRoot, 'src', 'subapps', name);
  fs.mkdirSync(subappDir, { recursive: true });

  fs.writeFileSync(path.join(subappDir, 'subapp.json'), JSON.stringify({
    name,
    version: '1.0.0',
    description: `${name} self-contained sub-app`,
    registrationEntry: './register.js'
  }, null, 2));

  fs.writeFileSync(path.join(subappDir, 'register.ts'), `export function register(context: any) {
  context.logger.log('Registering ${name} sub-app');
  return {
    name: '${name}',
    operations: []
  };
}
export default register;
`);

  console.log(`✅ Created Sub-App: src/subapps/${name}/`);
}
