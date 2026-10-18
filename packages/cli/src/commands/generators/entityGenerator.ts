import * as fs from 'fs';
import * as path from 'path';
import { getPlaneRoots } from './common.js';

export function generateEntity(name: string, projectRoot: string): void {
  const { backend, frontend } = getPlaneRoots(projectRoot);

  // Backend Entity
  const bEntityDir = path.join(backend, 'entities', name);
  fs.mkdirSync(path.join(bEntityDir, 'orchestrations'), { recursive: true });
  fs.mkdirSync(path.join(bEntityDir, 'tests'), { recursive: true });

  fs.writeFileSync(
    path.join(bEntityDir, `${name}.ts`),
    `import { Entity, KrnlMagneticLoader } from "@ultrst-armada/krnl-core";

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
`
  );

  fs.writeFileSync(
    path.join(bEntityDir, 'orchestrations', 'DefaultFlow.ts'),
    `export function configureDefaultFlow(entity: any) {
  return entity.flow("defaultFlow")
    .register({ visibility: "public" });
}
`
  );

  fs.writeFileSync(
    path.join(bEntityDir, 'tests', `${name}.test.ts`),
    `import { describe, it, expect } from "vitest";
import { ${name} } from "../${name}.js";

describe("${name} Entity", () => {
  it("instantiates correctly", () => {
    const instance = new ${name}();
    expect(instance.id).toBe("${name}");
  });
});
`
  );

  // Frontend Entity
  const fEntityDir = path.join(frontend, 'entities', name);
  fs.mkdirSync(path.join(fEntityDir, 'tests'), { recursive: true });

  fs.writeFileSync(
    path.join(fEntityDir, `${name}0.tsx`),
    `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-entity-${name.toLowerCase()}">
      <h2>${name} (Variant 0)</h2>
    </div>
  );
};

export default ${name}0;
`
  );

  fs.writeFileSync(
    path.join(fEntityDir, 'tests', `${name}0.test.tsx`),
    `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders variant 0", () => {
    expect(true).toBe(true);
  });
});
`
  );

  console.log(`✅ Created Backend Entity Folder: krnl/backend/entities/${name}/`);
  console.log(`✅ Created Frontend Entity Folder: krnl/frontend/entities/${name}/`);
}
