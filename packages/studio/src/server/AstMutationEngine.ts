import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind, SourceFile, Node, Block } from 'ts-morph';

export interface ArchitectureNode {
  id: string;
  type: 'entity' | 'functionality' | 'library' | 'subapp' | 'flow';
  name: string;
  parentEntity?: string;
  filePath: string;
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
  stateFields?: Array<{ name: string; type: string }>;
  helpers?: Array<{ name: string; filePath: string }>;
  uiSpec?: boolean;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'dataflow' | 'flow_step' | 'uses_library';
  deletable?: boolean;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export class AstMutationEngine {
  private projectRoot: string;
  private project: Project;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      this.project = new Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new Project({ compilerOptions: { target: 99 /* ESNext */ } });
    }
  }

  /**
   * Scans the workspace and builds the full visual architecture graph.
   */
  public extractArchitectureGraph(): ArchitectureGraph {
    const nodes: ArchitectureNode[] = [];
    const edges: ArchitectureEdge[] = [];

    // 1. Discover Entities
    const entitiesDir = path.join(this.projectRoot, 'src', 'entities');
    if (fs.existsSync(entitiesDir)) {
      const entityEntries = fs.readdirSync(entitiesDir, { withFileTypes: true });
      for (const entry of entityEntries) {
        if (entry.isDirectory()) {
          const entityName = entry.name;
          const entityFilePath = path.join(entitiesDir, entityName, `${entityName}.ts`);
          nodes.push({
            id: `entity:${entityName}`,
            type: 'entity',
            name: entityName,
            filePath: entityFilePath
          });

          // Discover Functionalities for this Entity
          const funcDir = path.join(entitiesDir, entityName, 'functionalities');
          if (fs.existsSync(funcDir)) {
            const funcs = fs.readdirSync(funcDir, { withFileTypes: true });
            for (const f of funcs) {
              if (f.isDirectory()) {
                const funcName = f.name;
                const funcPath = path.join(funcDir, funcName);
                const funcNode = this.parseFunctionalityQuadUnit(entityName, funcName, funcPath);
                nodes.push(funcNode);
                
                // Edge: Entity contains Functionality
                edges.push({
                  id: `edge:${entityName}->${funcName}`,
                  source: `entity:${entityName}`,
                  target: funcNode.id,
                  type: 'contains',
                  deletable: true
                });
              }
            }
          }
        }
      }
    }

    // 2. Discover Domain Concept Libraries (Layer 0)
    const libDir = path.join(this.projectRoot, 'src', 'libraries');
    if (fs.existsSync(libDir)) {
      const libFiles = fs.readdirSync(libDir, { withFileTypes: true });
      for (const file of libFiles) {
        if (file.isFile() && (file.name.endsWith('Concepts.ts') || file.name.endsWith('.ts'))) {
          const baseName = file.name.replace(/\.ts$/, '');
          const libPath = path.join(libDir, file.name);
          nodes.push({
            id: `library:${baseName}`,
            type: 'library',
            name: baseName,
            filePath: libPath
          });
        }
      }
    }

    // 3. Discover SubApps
    const subappDir = path.join(this.projectRoot, 'src', 'subapps');
    if (fs.existsSync(subappDir)) {
      const subapps = fs.readdirSync(subappDir, { withFileTypes: true });
      for (const sa of subapps) {
        if (sa.isDirectory()) {
          const saName = sa.name;
          const saPath = path.join(subappDir, saName);
          nodes.push({
            id: `subapp:${saName}`,
            type: 'subapp',
            name: saName,
            filePath: saPath
          });
        }
      }
    }

    return { nodes, edges };
  }

  private parseFunctionalityQuadUnit(entityName: string, funcName: string, funcPath: string): ArchitectureNode {
    const helpers: Array<{ name: string; filePath: string }> = [];
    const helpersDir = path.join(funcPath, 'helper_functions');
    if (fs.existsSync(helpersDir)) {
      const hFiles = fs.readdirSync(helpersDir);
      for (const h of hFiles) {
        if (h.endsWith('.ts') || h.endsWith('.js')) {
          helpers.push({
            name: path.basename(h, path.extname(h)),
            filePath: path.join(helpersDir, h)
          });
        }
      }
    }

    const hasUi = fs.existsSync(path.join(funcPath, 'ui')) || fs.existsSync(path.join(funcPath, `${funcName}UI.ts`));

    return {
      id: `functionality:${entityName}:${funcName}`,
      type: 'functionality',
      name: funcName,
      parentEntity: entityName,
      filePath: path.join(funcPath, 'main_function', 'logic.ts'),
      helpers,
      uiSpec: hasUi
    };
  }

  /**
   * Surgical AST Operation: Create Entity
   */
  public createEntity(entityName: string): { success: boolean; filePath: string } {
    const entityDir = path.join(this.projectRoot, 'src', 'entities', entityName);
    fs.mkdirSync(entityDir, { recursive: true });
    fs.mkdirSync(path.join(entityDir, 'functionalities'), { recursive: true });

    const entityFile = path.join(entityDir, `${entityName}.ts`);
    const content = `import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class ${entityName} extends Entity {
  constructor() {
    super({
      id: '${entityName}',
      version: '1.0.0',
      description: '${entityName} root entity'
    });
  }

  async boot(): Promise<void> {
    // Magnetic auto-discovery of functionalities, child entities, and subapps
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default ${entityName};
`;
    fs.writeFileSync(entityFile, content);
    return { success: true, filePath: entityFile };
  }

  /**
   * Surgical AST Operation: Create Quad-Unit Functionality
   */
  public createFunctionality(entityName: string, funcName: string): { success: boolean; filesCreated: string[] } {
    const funcDir = path.join(this.projectRoot, 'src', 'entities', entityName, 'functionalities', funcName);
    fs.mkdirSync(path.join(funcDir, 'main_function'), { recursive: true });
    fs.mkdirSync(path.join(funcDir, 'state_data'), { recursive: true });
    fs.mkdirSync(path.join(funcDir, 'helper_functions'), { recursive: true });
    fs.mkdirSync(path.join(funcDir, 'events'), { recursive: true });

    const atomFile = path.join(funcDir, `${funcName}Atom.ts`);
    fs.writeFileSync(atomFile, `export interface ${funcName}Input {
  payload?: any;
}

export interface ${funcName}Output {
  success: boolean;
  timestamp: number;
}
`);

    const logicFile = path.join(funcDir, 'main_function', 'logic.ts');
    fs.writeFileSync(logicFile, `import { ${funcName}Input, ${funcName}Output } from '../${funcName}Atom.js';
import { executeStep } from '../helper_functions/executeStep.js';

export const main = async (input: ${funcName}Input, { state, entity }: any): Promise<${funcName}Output> => {
  const timestamp = executeStep();
  return {
    success: true,
    timestamp
  };
};
`);

    const stateFile = path.join(funcDir, 'state_data', 'state.ts');
    fs.writeFileSync(stateFile, `export interface ${funcName}State {
  executionCount: number;
}

export const initialState: ${funcName}State = {
  executionCount: 0
};
`);

    const helperFile = path.join(funcDir, 'helper_functions', 'executeStep.ts');
    fs.writeFileSync(helperFile, `export function executeStep(): number {
  return Date.now();
}
`);

    return {
      success: true,
      filesCreated: [atomFile, logicFile, stateFile, helperFile]
    };
  }

  /**
   * Surgical AST Operation: Create Domain Concept Library (Layer 0)
   */
  public createLibrary(domainName: string): { success: boolean; filePath: string } {
    const libDir = path.join(this.projectRoot, 'src', 'libraries');
    fs.mkdirSync(libDir, { recursive: true });

    const fileName = `${domainName}Concepts.ts`;
    const filePath = path.join(libDir, fileName);
    const content = `/**
 * @file ${fileName}
 * @role component
 * @description Layer 0 pure domain concept library for ${domainName}.
 */

export class ${domainName}Concepts {
  static pureTransform<T>(data: T): T {
    return data;
  }
}
`;
    fs.writeFileSync(filePath, content);
    return { success: true, filePath };
  }

  /**
   * Surgical AST Operation: Add Flow Connection (entity.flow().then().branch())
   */
  public addFlowStep(entityFilePath: string, flowName: string, stepFunctionName: string): boolean {
    if (!fs.existsSync(entityFilePath)) return false;
    const sf = this.project.addSourceFileAtPath(entityFilePath);
    
    let modified = false;
    sf.forEachDescendant(node => {
      if (Node.isMethodDeclaration(node) && node.getName() === 'boot') {
        const body = node.getBody();
        if (body && Node.isBlock(body)) {
          const stmts = body.getStatements();
          const insertIdx = Math.max(0, stmts.length - 1);
          body.insertStatements(insertIdx, `this.flow('${flowName}').then('${stepFunctionName}').register({ visibility: 'public' });`);
          modified = true;
        }
      }
    });

    if (modified) {
      sf.formatText({ indentSize: 2 });
      sf.saveSync();
    }
    return modified;
  }
}
