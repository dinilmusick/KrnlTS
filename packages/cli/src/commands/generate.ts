import { generateOrchestration } from './generators/orchestrationGenerator.js';
import { generateFunctionality } from './generators/functionalityGenerator.js';
import { generateLibrary } from './generators/libraryGenerator.js';

export async function runGenerate(
  type: string,
  name: string,
  _parentService?: string,
  projectRoot: string = process.cwd()
): Promise<void> {
  if (!name) {
    console.error('❌ Error: Resource name is required. Usage: krnl generate <orchestration|functionality|library> <Name>');
    process.exit(1);
  }

  switch (type.toLowerCase()) {
    case 'orchestration':
      generateOrchestration(name, projectRoot);
      break;
    case 'functionality':
      generateFunctionality(name, projectRoot);
      break;
    case 'library':
      generateLibrary(name, projectRoot);
      break;
    default:
      console.error(`❌ Unknown resource type "${type}". Valid types: orchestration, functionality, library`);
      process.exit(1);
  }
}

