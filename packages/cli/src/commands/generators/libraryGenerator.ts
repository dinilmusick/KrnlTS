import * as fs from 'fs';
import * as path from 'path';
import { KrnlPackageReconciler } from '@ultrst-armada/krnl-core';
import { getPlaneRoots } from './common.js';

export function generateLibrary(name: string, projectRoot: string, parentService?: string): void {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const conceptName = name.endsWith('Concepts') ? name : `${name}Concepts`;

  // Determine service owner: parentService, or inspect existing services, or fallback to 'App'
  let targetService = parentService;
  if (!targetService) {
    const servicesDir = path.join(backend, 'services');
    if (fs.existsSync(servicesDir)) {
      const existing = fs.readdirSync(servicesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
      if (existing.length === 1) {
        targetService = existing[0].name;
      }
    }
  }
  if (!targetService) {
    targetService = 'App';
  }

  // Backend Library (Strictly Service-Owned)
  const bLibDir = path.join(backend, 'services', targetService, 'libraries', conceptName);
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
    path.join(bLibDir, 'index.ts'),
    `export * from "./definitions.js";
export * from "./functions.js";
`
  );

  fs.writeFileSync(
    path.join(bLibDir, 'manifest.json'),
    JSON.stringify({ name: conceptName, service: targetService, dependencies: {} }, null, 2)
  );

  fs.writeFileSync(
    path.join(bLibDir, 'tests', `${conceptName}.test.ts`),
    `import { describe, it, expect } from "vitest";
import { ${name.toLowerCase()}Transform } from "../functions.js";

describe("${conceptName}", () => {
  it("runs correctly", () => {
    expect(${name.toLowerCase()}Transform(42)).toBe(42);
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
  console.log(`✅ Created Service-Owned Library: ${path.relative(projectRoot, bLibDir)}/ (Owner: ${targetService})`);
  console.log(`✅ Created Frontend Concept Library: ${path.relative(projectRoot, fLibDir)}/`);
}
