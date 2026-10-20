import * as fs from 'fs';
import * as path from 'path';
import { KrnlPackageReconciler } from '@ultrst-armada/krnl-core';
import { getPlaneRoots } from './common.js';

export function generateService(name: string, projectRoot: string, defaultFrontend?: { component: string; package?: string }): void {
  if (!defaultFrontend?.component) {
    throw new Error('[krnl generate service] --default-frontend=<FLOKSComponent> is required. A service must declare its canonical frontend component reference.');
  }
  const { backend } = getPlaneRoots(projectRoot);
  const serviceDir = path.join(backend, 'services', name);

  const funcsDir = path.join(serviceDir, 'functionalities');
  const orchsDir = path.join(serviceDir, 'orchestrations');
  const libsDir = path.join(serviceDir, 'libraries');
  const testsDir = path.join(serviceDir, 'tests');

  fs.mkdirSync(funcsDir, { recursive: true });
  fs.mkdirSync(orchsDir, { recursive: true });
  fs.mkdirSync(libsDir, { recursive: true });
  fs.mkdirSync(testsDir, { recursive: true });

  const conceptName = `${name}Concepts`;
  const defaultLibDir = path.join(libsDir, conceptName);
  fs.mkdirSync(path.join(defaultLibDir, 'tests'), { recursive: true });

  fs.writeFileSync(
    path.join(defaultLibDir, 'definitions.ts'),
    `/**
 * @file definitions.ts
 * @role component
 */
export interface ${name}Options {
  enabled?: boolean;
}
`
  );

  fs.writeFileSync(
    path.join(defaultLibDir, 'functions.ts'),
    `/**
 * @file functions.ts
 * @role component
 */
import type { ${name}Options } from "./definitions.js";

export function format${name}Name(input: string, _opts?: ${name}Options): string {
  return "${name}: " + input;
}
`
  );

  fs.writeFileSync(
    path.join(defaultLibDir, 'index.ts'),
    `export * from "./definitions.js";
export * from "./functions.js";
`
  );

  fs.writeFileSync(
    path.join(defaultLibDir, 'manifest.json'),
    JSON.stringify({ name: conceptName, description: `${name} service-owned library`, dependencies: {} }, null, 2)
  );

  fs.writeFileSync(
    path.join(defaultLibDir, 'tests', `${conceptName}.test.ts`),
    `import { describe, it, expect } from "vitest";
import { format${name}Name } from "../functions.js";

describe("${conceptName}", () => {
  it("formats name correctly", () => {
    expect(format${name}Name("test")).toContain("${name}");
  });
});
`
  );

  fs.writeFileSync(
    path.join(serviceDir, `${name}ServiceFacade.ts`),
    `import { ServiceFacade } from "@ultrst-armada/krnl-core";
import * as ${name.toLowerCase()}Concepts from "./libraries/${conceptName}/index.js";

export const ${name}ServiceFacade = new ServiceFacade({
  id: "${name.toLowerCase()}.service",
  name: "${name}Service",
  version: "1.0.0",
  description: "${name} service facade",
  libraries: {
    ${conceptName}: ${name.toLowerCase()}Concepts,
  },
});

export default ${name}ServiceFacade;
`
  );

  fs.writeFileSync(
    path.join(testsDir, `${name}ServiceFacade.test.ts`),
    `import { describe, it, expect } from "vitest";
import { ${name}ServiceFacade } from "../${name}ServiceFacade.js";

describe("${name}ServiceFacade", () => {
  it("initializes and exposes service-owned library", () => {
    expect(${name}ServiceFacade.id).toBe("${name.toLowerCase()}.service");
    expect(${name}ServiceFacade.libraries.${conceptName}).toBeDefined();
    expect(typeof ${name}ServiceFacade.libraries.${conceptName}.format${name}Name).toBe("function");
  });
});
`
  );

  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`✅ Created Service: ${path.relative(projectRoot, serviceDir)}/`);
}
