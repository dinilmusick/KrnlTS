import * as fs from 'fs';
import * as path from 'path';
import { KrnlPackageReconciler } from '@dinilmusick/krnl-core';
import { getPlaneRoots } from './common.js';

export function generateLibrary(name: string, projectRoot: string): void {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const conceptName = name.endsWith('Concepts') ? name : `${name}Concepts`;

  // Backend Library
  const bLibDir = path.join(backend, 'libraries', conceptName);
  fs.mkdirSync(path.join(bLibDir, 'tests'), { recursive: true });

  fs.writeFileSync(
    path.join(bLibDir, 'definitions.ts'),
    `/**
 * @file definitions.ts
 * @role component
 */
export interface ${conceptName}Options {
  enabled?: boolean;
}
`
  );

  fs.writeFileSync(
    path.join(bLibDir, 'functions.ts'),
    `/**
 * @file functions.ts
 * @role component
 */
import type { ${conceptName}Options } from "./definitions.js";

export function ${name.toLowerCase()}Transform<T>(data: T, _opts?: ${conceptName}Options): T {
  return data;
}
`
  );

  fs.writeFileSync(
    path.join(bLibDir, 'manifest.json'),
    JSON.stringify({ name: conceptName, dependencies: {} }, null, 2)
  );

  fs.writeFileSync(
    path.join(bLibDir, 'tests', `${conceptName}.test.ts`),
    `import { describe, it, expect } from "vitest";

describe("${conceptName}", () => {
  it("runs correctly", () => {
    expect(true).toBe(true);
  });
});
`
  );

  // Frontend Library
  const fLibDir = path.join(frontend, 'libraries', conceptName);
  fs.mkdirSync(path.join(fLibDir, 'tests'), { recursive: true });

  fs.writeFileSync(
    path.join(fLibDir, 'definitions.ts'),
    `export interface ${name}Props {
  label?: string;
}
`
  );

  fs.writeFileSync(
    path.join(fLibDir, 'components.tsx'),
    `import React from "react";
import type { ${name}Props } from "./definitions.js";
import "./styles.css";

export const ${name}: React.FC<${name}Props> = ({ label = "${name}" }) => {
  return <div className="krnl-${name.toLowerCase()}">{label}</div>;
};
`
  );

  fs.writeFileSync(
    path.join(fLibDir, 'styles.css'),
    `.krnl-${name.toLowerCase()} {
  font-family: inherit;
}
`
  );

  fs.writeFileSync(
    path.join(fLibDir, 'manifest.json'),
    JSON.stringify({ name: `${conceptName}UI`, dependencies: {} }, null, 2)
  );

  fs.writeFileSync(
    path.join(fLibDir, 'tests', `${name}.test.tsx`),
    `import { describe, it, expect } from "vitest";

describe("${name} UI Concept", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`
  );

  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`✅ Created Backend Concept Library: krnl/backend/libraries/${conceptName}/`);
  console.log(`✅ Created Frontend Concept Library: krnl/frontend/libraries/${conceptName}/`);
}

export function generateSubApp(name: string, projectRoot: string): void {
  const { backend } = getPlaneRoots(projectRoot);
  const subappDir = path.join(backend, 'subapps', name);
  fs.mkdirSync(subappDir, { recursive: true });

  fs.writeFileSync(
    path.join(subappDir, 'subapp.json'),
    JSON.stringify(
      {
        name,
        version: '1.0.0',
        description: `${name} self-contained sub-app`,
        registrationEntry: './register.js',
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(subappDir, 'register.ts'),
    `export function register(context: any) {
  context.logger.log("Registering ${name} sub-app");
  return {
    name: "${name}",
    operations: []
  };
}
export default register;
`
  );

  console.log(`✅ Created Sub-App: krnl/backend/subapps/${name}/`);
}
