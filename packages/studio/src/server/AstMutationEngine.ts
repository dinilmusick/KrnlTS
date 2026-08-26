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

    // Find entities in src/entities or entities/
    const possibleEntityDirs = [
      path.join(this.projectRoot, 'src', 'entities'),
      path.join(this.projectRoot, 'entities')
    ];

    for (const entitiesDir of possibleEntityDirs) {
      if (fs.existsSync(entitiesDir)) {
        this.scanEntitiesRecursive(entitiesDir, nodes, edges);
      }
    }

    // Find Domain Concept Libraries in src/libraries or libraries/
    const possibleLibDirs = [
      path.join(this.projectRoot, 'src', 'libraries'),
      path.join(this.projectRoot, 'libraries')
    ];

    for (const libDir of possibleLibDirs) {
      if (fs.existsSync(libDir)) {
        const libFiles = fs.readdirSync(libDir, { withFileTypes: true });
        for (const file of libFiles) {
          if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
            const baseName = file.name.replace(/\.(ts|js)$/, '');
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
    }

    // Find SubApps in src/subapps or subapps/
    const possibleSubappDirs = [
      path.join(this.projectRoot, 'src', 'subapps'),
      path.join(this.projectRoot, 'subapps')
    ];

    for (const subappDir of possibleSubappDirs) {
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
    }

    return { nodes, edges };
  }

  private scanEntitiesRecursive(entitiesDir: string, nodes: ArchitectureNode[], edges: ArchitectureEdge[], parentEntityName?: string) {
    const entries = fs.readdirSync(entitiesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entityName = entry.name;
        const entityDir = path.join(entitiesDir, entityName);
        let entityFile = path.join(entityDir, `${entityName}.ts`);
        if (!fs.existsSync(entityFile)) {
          entityFile = path.join(entityDir, `${entityName}.js`);
        }

        const entityNodeId = `entity:${entityName}`;
        nodes.push({
          id: entityNodeId,
          type: 'entity',
          name: entityName,
          parentEntity: parentEntityName,
          filePath: fs.existsSync(entityFile) ? entityFile : entityDir
        });

        if (parentEntityName) {
          edges.push({
            id: `edge:${parentEntityName}->child:${entityName}`,
            source: `entity:${parentEntityName}`,
            target: entityNodeId,
            type: 'contains',
            deletable: true
          });
        }

        // Scan functionalities
        const funcDir = path.join(entityDir, 'functionalities');
        if (fs.existsSync(funcDir)) {
          const funcs = fs.readdirSync(funcDir, { withFileTypes: true });
          for (const f of funcs) {
            if (f.isDirectory()) {
              const funcName = f.name;
              const funcPath = path.join(funcDir, funcName);
              const funcNode = this.parseFunctionalityQuadUnit(entityName, funcName, funcPath);
              nodes.push(funcNode);

              edges.push({
                id: `edge:${entityName}->${funcName}`,
                source: entityNodeId,
                target: funcNode.id,
                type: 'contains',
                deletable: true
              });
            }
          }
        }

        // Scan nested child entities
        const childEntitiesDir = path.join(entityDir, 'entities');
        if (fs.existsSync(childEntitiesDir)) {
          this.scanEntitiesRecursive(childEntitiesDir, nodes, edges, entityName);
        }
      }
    }
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

    let logicFile = path.join(funcPath, 'main_function', 'logic.ts');
    if (!fs.existsSync(logicFile)) {
      logicFile = path.join(funcPath, 'main_function', 'logic.js');
    }
    if (!fs.existsSync(logicFile)) {
      logicFile = path.join(funcPath, `${funcName}.ts`);
    }
    if (!fs.existsSync(logicFile)) {
      logicFile = path.join(funcPath, `${funcName}.js`);
    }

    return {
      id: `functionality:${entityName}:${funcName}`,
      type: 'functionality',
      name: funcName,
      parentEntity: entityName,
      filePath: logicFile,
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
