import * as fs from "fs";
import * as path from "path";
import { KrnlPackageReconciler } from "@dinilmusick/krnl-core";

export async function runGenerate(type: string, name: string, _parentEntity?: string, projectRoot: string = process.cwd()): Promise<void> {
  if (!name) {
    console.error("❌ Error: Resource name is required. Usage: krnl generate <entity|functionality|library|subapp> <Name>");
    process.exit(1);
  }

  switch (type.toLowerCase()) {
    case "entity":
      generateEntity(name, projectRoot);
      break;
    case "functionality":
      generateFunctionality(name, projectRoot);
      break;
    case "library":
      generateLibrary(name, projectRoot);
      break;
    case "subapp":
      generateSubApp(name, projectRoot);
      break;
    default:
      console.error(`❌ Unknown resource type "${type}". Valid types: entity, functionality, library, subapp`);
      process.exit(1);
  }
}

function getPlaneRoots(projectRoot: string) {
  const krnlRoot = path.join(projectRoot, "krnl");
  if (fs.existsSync(krnlRoot)) {
    return {
      backend: path.join(krnlRoot, "backend"),
      frontend: path.join(krnlRoot, "frontend"),
      isKrnlDir: true
    };
  }
  return {
    backend: path.join(projectRoot, "src"),
    frontend: path.join(projectRoot, "src"),
    isKrnlDir: false
  };
}

function generateEntity(name: string, projectRoot: string) {
  const { backend, frontend } = getPlaneRoots(projectRoot);

  // Backend Entity
  const bEntityDir = path.join(backend, "entities", name);
  fs.mkdirSync(path.join(bEntityDir, "orchestrations"), { recursive: true });
  fs.mkdirSync(path.join(bEntityDir, "tests"), { recursive: true });

  fs.writeFileSync(path.join(bEntityDir, `${name}.ts`), `import { Entity, KrnlMagneticLoader } from "@dinilmusick/krnl-core";

/**
 * @role skeleton
 */
export class ${name} extends Entity {
  constructor() {
    super({
      id: "${name}",
      version: "1.0.0",
      description: "${name} entity"
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default ${name};
`);

  fs.writeFileSync(path.join(bEntityDir, "orchestrations", "DefaultFlow.ts"), `export function configureDefaultFlow(entity: any) {
  return entity.flow("defaultFlow")
    .register({ visibility: "public" });
}
`);

  fs.writeFileSync(path.join(bEntityDir, "tests", `${name}.test.ts`), `import { describe, it, expect } from "vitest";
import { ${name} } from "../${name}.js";

describe("${name} Entity", () => {
  it("instantiates correctly", () => {
    const instance = new ${name}();
    expect(instance.id).toBe("${name}");
  });
});
`);

  // Frontend Entity
  const fEntityDir = path.join(frontend, "entities", name);
  fs.mkdirSync(path.join(fEntityDir, "tests"), { recursive: true });

  fs.writeFileSync(path.join(fEntityDir, `${name}0.tsx`), `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-entity-${name.toLowerCase()}">
      <h2>${name} (Variant 0)</h2>
    </div>
  );
};

export default ${name}0;
`);

  fs.writeFileSync(path.join(fEntityDir, "tests", `${name}0.test.tsx`), `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders variant 0", () => {
    expect(true).toBe(true);
  });
});
`);

  console.log(`✅ Created Backend Entity Folder: krnl/backend/entities/${name}/`);
  console.log(`✅ Created Frontend Entity Folder: krnl/frontend/entities/${name}/`);
}

function generateFunctionality(name: string, projectRoot: string) {
  const { backend, frontend } = getPlaneRoots(projectRoot);

  // Backend Functionality
  const bFuncDir = path.join(backend, "functionalities", name);
  fs.mkdirSync(path.join(bFuncDir, "main_function"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "state_data"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "helper_functions"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "events"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "tests"), { recursive: true });

  fs.writeFileSync(path.join(bFuncDir, `${name}Atom.ts`), `export interface ${name}Input {
  payload?: string;
}

export interface ${name}Output {
  success: boolean;
  timestamp: number;
}
`);

  fs.writeFileSync(path.join(bFuncDir, "manifest.json"), JSON.stringify({
    name,
    description: `${name} quad-unit functionality`,
    dependencies: {}
  }, null, 2));

  fs.writeFileSync(path.join(bFuncDir, "main_function", "logic.ts"), `import type { ${name}Input, ${name}Output } from "../${name}Atom.js";

export const main = async (input: ${name}Input, { state }: any): Promise<${name}Output> => {
  return {
    success: true,
    timestamp: Date.now()
  };
};
`);

  fs.writeFileSync(path.join(bFuncDir, "main_function", "lifecycle.ts"), `export async function onMount() {}
export async function onTeardown() {}
`);

  fs.writeFileSync(path.join(bFuncDir, "state_data", "state.ts"), `export interface ${name}State {
  executionCount: number;
}

export const initialState: ${name}State = {
  executionCount: 0
};
`);

  fs.writeFileSync(path.join(bFuncDir, "helper_functions", "helper.ts"), `/**
 * @role component
 */
export function exampleHelper(): boolean {
  return true;
}
`);

  fs.writeFileSync(path.join(bFuncDir, "events", "events.ts"), `/**
 * @role component
 */
export interface ${name}CompletedEvent {
  timestamp: number;
}
`);

  fs.writeFileSync(path.join(bFuncDir, "tests", `${name}.test.ts`), `import { describe, it, expect } from "vitest";

describe("${name} functionality", () => {
  it("passes basic test", () => {
    expect(true).toBe(true);
  });
});
`);

  // Frontend Functionality
  const fFuncDir = path.join(frontend, "functionalities", name);
  fs.mkdirSync(path.join(fFuncDir, "tests"), { recursive: true });

  fs.writeFileSync(path.join(fFuncDir, `${name}0.tsx`), `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-func-${name.toLowerCase()}">
      <h3>${name} (Variant 0)</h3>
    </div>
  );
};

export default ${name}0;
`);

  fs.writeFileSync(path.join(fFuncDir, "manifest.json"), JSON.stringify({
    name: `${name}UI`,
    dependencies: {}
  }, null, 2));

  fs.writeFileSync(path.join(fFuncDir, "tests", `${name}0.test.tsx`), `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`);

  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`✅ Created Backend Functionality Quad-Unit: krnl/backend/functionalities/${name}/`);
  console.log(`✅ Created Frontend Functionality: krnl/frontend/functionalities/${name}/`);
}

function generateLibrary(name: string, projectRoot: string) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const conceptName = name.endsWith("Concepts") ? name : `${name}Concepts`;

  // Backend Library
  const bLibDir = path.join(backend, "libraries", conceptName);
  fs.mkdirSync(path.join(bLibDir, "tests"), { recursive: true });

  fs.writeFileSync(path.join(bLibDir, "definitions.ts"), `/**
 * @file definitions.ts
 * @role component
 */
export interface ${conceptName}Options {
  enabled?: boolean;
}
`);

  fs.writeFileSync(path.join(bLibDir, "functions.ts"), `/**
 * @file functions.ts
 * @role component
 */
import type { ${conceptName}Options } from "./definitions.js";

export function ${name.toLowerCase()}Transform<T>(data: T, _opts?: ${conceptName}Options): T {
  return data;
}
`);

  fs.writeFileSync(path.join(bLibDir, "manifest.json"), JSON.stringify({
    name: conceptName,
    dependencies: {}
  }, null, 2));

  fs.writeFileSync(path.join(bLibDir, "tests", `${conceptName}.test.ts`), `import { describe, it, expect } from "vitest";

describe("${conceptName}", () => {
  it("runs correctly", () => {
    expect(true).toBe(true);
  });
});
`);

  // Frontend Library
  const fLibDir = path.join(frontend, "libraries", conceptName);
  fs.mkdirSync(path.join(fLibDir, "tests"), { recursive: true });

  fs.writeFileSync(path.join(fLibDir, "definitions.ts"), `export interface ${name}Props {
  label?: string;
}
`);

  fs.writeFileSync(path.join(fLibDir, "components.tsx"), `import React from "react";
import type { ${name}Props } from "./definitions.js";
import "./styles.css";

export const ${name}: React.FC<${name}Props> = ({ label = "${name}" }) => {
  return <div className="krnl-${name.toLowerCase()}">{label}</div>;
};
`);

  fs.writeFileSync(path.join(fLibDir, "styles.css"), `.krnl-${name.toLowerCase()} {
  font-family: inherit;
}
`);

  fs.writeFileSync(path.join(fLibDir, "manifest.json"), JSON.stringify({
    name: `${conceptName}UI`,
    dependencies: {}
  }, null, 2));

  fs.writeFileSync(path.join(fLibDir, "tests", `${name}.test.tsx`), `import { describe, it, expect } from "vitest";

describe("${name} UI Concept", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`);

  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`✅ Created Backend Concept Library: krnl/backend/libraries/${conceptName}/`);
  console.log(`✅ Created Frontend Concept Library: krnl/frontend/libraries/${conceptName}/`);
}

function generateSubApp(name: string, projectRoot: string) {
  const { backend } = getPlaneRoots(projectRoot);
  const subappDir = path.join(backend, "subapps", name);
  fs.mkdirSync(subappDir, { recursive: true });

  fs.writeFileSync(path.join(subappDir, "subapp.json"), JSON.stringify({
    name,
    version: "1.0.0",
    description: `${name} self-contained sub-app`,
    registrationEntry: "./register.js"
  }, null, 2));

  fs.writeFileSync(path.join(subappDir, "register.ts"), `export function register(context: any) {
  context.logger.log("Registering ${name} sub-app");
  return {
    name: "${name}",
    operations: []
  };
}
export default register;
`);

  console.log(`✅ Created Sub-App: krnl/backend/subapps/${name}/`);
}
