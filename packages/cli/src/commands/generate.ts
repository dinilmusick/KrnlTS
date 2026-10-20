import {
  generateFunctionalityOrchestration,
} from './generators/functionalityOrchestrationGenerator.js';
import { generateFunctionality } from './generators/functionalityGenerator.js';
import { generateLibrary } from './generators/libraryGenerator.js';
import { generateService } from './generators/serviceGenerator.js';

export async function runGenerate(
  type: string,
  name: string,
  parentService?: string,
  projectRoot: string = process.cwd()
): Promise<void> {
  if (!name) {
    console.error(
      '❌ Error: Resource name is required. Usage: krnl generate <service|orchestration|functionality|library> <Name> [parentService]'
    );
    process.exit(1);
  }

  const normalizedType = type.toLowerCase().replace(/[-_]/g, '');

  switch (normalizedType) {
    case 'service':
      generateService(name, projectRoot, options.defaultFrontend);
      break;
    case 'functionalityorchestration':
    case 'orchestration':
      generateFunctionalityOrchestration(name, projectRoot);
      break;
    case 'functionality':
      generateFunctionality(name, projectRoot, parentService);
      break;
    case 'library':
      generateLibrary(name, projectRoot, parentService);
      break;
    default:
      console.error(
        `❌ Unknown resource type "${type}". Valid types: service, orchestration, functionality, library`
      );
      process.exit(1);
  }
}
