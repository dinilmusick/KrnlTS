import { generateEntity } from './generators/entityGenerator.js';
import { generateFunctionality } from './generators/functionalityGenerator.js';
import { generateLibrary, generateSubApp } from './generators/libraryGenerator.js';

export async function runGenerate(
  type: string,
  name: string,
  _parentEntity?: string,
  projectRoot: string = process.cwd()
): Promise<void> {
  if (!name) {
    console.error('❌ Error: Resource name is required. Usage: krnl generate <entity|functionality|library|subapp> <Name>');
    process.exit(1);
  }

  switch (type.toLowerCase()) {
    case 'entity':
      generateEntity(name, projectRoot);
      break;
    case 'functionality':
      generateFunctionality(name, projectRoot);
      break;
    case 'library':
      generateLibrary(name, projectRoot);
      break;
    case 'subapp':
      generateSubApp(name, projectRoot);
      break;
    default:
      console.error(`❌ Unknown resource type "${type}". Valid types: entity, functionality, library, subapp`);
      process.exit(1);
  }
}
