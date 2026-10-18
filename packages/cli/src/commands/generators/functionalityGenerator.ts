import * as fs from 'fs';
import * as path from 'path';
import { KrnlPackageReconciler } from '@ultrst-armada/krnl-core';
import { getPlaneRoots } from './common.js';

export interface FunctionalityGeneratorOptions {
  parentService?: string;
  withState?: boolean;
}

export function generateFunctionality(
  name: string,
  projectRoot: string,
  parentServiceOrOptions?: string | FunctionalityGeneratorOptions
): void {
  const { backend, frontend } = getPlaneRoots(projectRoot);

  const options: FunctionalityGeneratorOptions =
    typeof parentServiceOrOptions === 'string'
      ? { parentService: parentServiceOrOptions }
      : parentServiceOrOptions || {};

  let targetService = options.parentService;
  if (!targetService) {
    const servicesDir = path.join(backend, 'services');
    if (fs.existsSync(servicesDir)) {
      const existing = fs.readdirSync(servicesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
      if (existing.length === 1) {
        targetService = existing[0].name;
      }
    }
  }

  // If a targetService is identified, place functionality inside that service; else fallback to root functionalities
  const bFuncDir = targetService
    ? path.join(backend, 'services', targetService, 'functionalities', name)
    : path.join(backend, 'functionalities', name);

  fs.mkdirSync(path.join(bFuncDir, 'main_function'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'helper_functions'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'events'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'tests'), { recursive: true });

  // Only create state_data if explicitly requested withState
  if (options.withState) {
    fs.mkdirSync(path.join(bFuncDir, 'state_data'), { recursive: true });
    fs.writeFileSync(
      path.join(bFuncDir, 'state_data', 'state.ts'),
      `export interface ${name}State {
  executionCount: number;
}

export const initialState: ${name}State = {
  executionCount: 0
};
`
    );
  }

  fs.writeFileSync(
    path.join(bFuncDir, `${name}Atom.ts`),
    `export interface ${name}Input {
  payload?: string;
}

export interface ${name}Output {
  success: boolean;
  timestamp: number;
}
`
  );

  fs.writeFileSync(
    path.join(bFuncDir, 'manifest.json'),
    JSON.stringify(
      {
        name,
        service: targetService || undefined,
        description: `${name} quad-unit functionality`,
        dependencies: {},
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(bFuncDir, 'main_function', 'logic.ts'),
    `import type { ${name}Input, ${name}Output } from "../${name}Atom.js";

export const main = async (input: ${name}Input, context: any): Promise<${name}Output> => {
  return {
    success: true,
    timestamp: Date.now()
  };
};
`
  );

  fs.writeFileSync(
    path.join(bFuncDir, 'main_function', 'lifecycle.ts'),
    `export async function onMount() {}
export async function onTeardown() {}
`
  );

  fs.writeFileSync(
    path.join(bFuncDir, 'helper_functions', 'helper.ts'),
    `/**
 * @role component
 */
export function exampleHelper(): boolean {
  return true;
}
`
  );

  fs.writeFileSync(
    path.join(bFuncDir, 'events', 'events.ts'),
    `/**
 * @role component
 */
export interface ${name}CompletedEvent {
  timestamp: number;
}
`
  );

  fs.writeFileSync(
    path.join(bFuncDir, 'tests', `${name}.test.ts`),
    `import { describe, it, expect } from "vitest";

describe("${name} functionality", () => {
  it("passes basic test", () => {
    expect(true).toBe(true);
  });
});
`
  );

  // Frontend Functionality
  const fFuncDir = path.join(frontend, 'functionalities', name);
  fs.mkdirSync(path.join(fFuncDir, 'tests'), { recursive: true });

  fs.writeFileSync(
    path.join(fFuncDir, `${name}0.tsx`),
    `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-func-${name.toLowerCase()}">
      <h3>${name} (Variant 0)</h3>
    </div>
  );
};

export default ${name}0;
`
  );

  fs.writeFileSync(
    path.join(fFuncDir, 'manifest.json'),
    JSON.stringify({ name: `${name}UI`, dependencies: {} }, null, 2)
  );

  fs.writeFileSync(
    path.join(fFuncDir, 'tests', `${name}0.test.tsx`),
    `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`
  );

  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`✅ Created Backend Functionality: ${path.relative(projectRoot, bFuncDir)}/`);
  console.log(`✅ Created Frontend Functionality: ${path.relative(projectRoot, fFuncDir)}/`);
}
