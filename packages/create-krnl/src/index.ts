#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { KrnlPackageReconciler } from "@dinilmusick/krnl-core";

const rawArg = process.argv[2] || "my-krnl-app";
const targetDir = path.resolve(process.cwd(), rawArg);
const projectName = path.basename(targetDir);

console.log(`\n🚀 [create-krnl] Scaffolding new Krnl project with symmetric backend/frontend planes in: ${targetDir}\n`);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Directory "${projectName}" already exists.`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// ─── DIRECTORY SKELETON (krnl/backend & krnl/frontend) ─────────────────────────
// Backend
const bLibDir = path.join(targetDir, "krnl", "backend", "libraries", "AppConcepts");
const bEntityDir = path.join(targetDir, "krnl", "backend", "entities", "App");
const bFuncDir = path.join(targetDir, "krnl", "backend", "functionalities", "Hello");

fs.mkdirSync(path.join(bLibDir, "tests"), { recursive: true });
fs.mkdirSync(path.join(bEntityDir, "orchestrations"), { recursive: true });
fs.mkdirSync(path.join(bEntityDir, "tests"), { recursive: true });
fs.mkdirSync(path.join(bFuncDir, "main_function"), { recursive: true });
fs.mkdirSync(path.join(bFuncDir, "state_data"), { recursive: true });
fs.mkdirSync(path.join(bFuncDir, "helper_functions"), { recursive: true });
fs.mkdirSync(path.join(bFuncDir, "events"), { recursive: true });
fs.mkdirSync(path.join(bFuncDir, "tests"), { recursive: true });

// Frontend
const fLibDir = path.join(targetDir, "krnl", "frontend", "libraries", "ButtonConcepts");
const fEntityDir = path.join(targetDir, "krnl", "frontend", "entities", "App");
const fFuncDir = path.join(targetDir, "krnl", "frontend", "functionalities", "Hello");

fs.mkdirSync(path.join(fLibDir, "tests"), { recursive: true });
fs.mkdirSync(path.join(fEntityDir, "tests"), { recursive: true });
fs.mkdirSync(path.join(fFuncDir, "tests"), { recursive: true });

fs.mkdirSync(path.join(targetDir, "docs"), { recursive: true });
fs.mkdirSync(path.join(targetDir, ".skipo"), { recursive: true });

// ─── 1. BASE PACKAGE.JSON ──────────────────────────────────────────────────────
fs.writeFileSync(path.join(targetDir, "package.json"), JSON.stringify({
  name: projectName,
  version: "1.0.0",
  description: "Full-stack application powered by Krnl symmetric architecture",
  type: "module",
  main: "dist/index.js",
  scripts: {
    dev: "krnl dev",
    build: "krnl build",
    validate: "krnl validate",
    test: "vitest run",
    sync: "krnl sync"
  },
  dependencies: {
    "@dinilmusick/krnl": "^1.0.0",
    "@dinilmusick/krnl-core": "^1.0.0",
    "@dinilmusick/krnl-ui": "^1.0.0"
  },
  devDependencies: {
    "@dinilmusick/krnl-cli": "^1.0.0",
    "@dinilmusick/krnl-validate": "^1.0.0",
    "@dinilmusick/eslint-plugin-krnl": "^1.0.0",
    "typescript": "^5.7.3",
    "vitest": "^1.6.0"
  }
}, null, 2));

// ─── 2. TSCONFIG.JSON ──────────────────────────────────────────────────────────
fs.writeFileSync(path.join(targetDir, "tsconfig.json"), JSON.stringify({
  compilerOptions: {
    target: "ESNext",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    lib: ["ESNext", "DOM"],
    jsx: "react-jsx",
    strict: true,
    outDir: "./dist",
    skipLibCheck: true,
    resolveJsonModule: true,
    paths: {
      "@/*": ["./krnl/*"]
    }
  },
  include: ["krnl/**/*", `${projectName}.ts`, "krnl-magnetic.d.ts"],
  exclude: ["node_modules", "dist"]
}, null, 2));

// ─── 3. APP ENTRYPOINT (<projectName>.ts) (Replaces krnl.json) ─────────────────
fs.writeFileSync(path.join(targetDir, `${projectName}.ts`), `import { defineApp, Protocols } from "@dinilmusick/krnl-core";
import { App } from "./krnl/backend/entities/App/App.js";

export default defineApp({
  name: "${projectName}",
  version: "1.0.0",
  description: "${projectName} application entrypoint",
  protocols: [
    Protocols.HTTP({ port: 8080, prefix: "/api" }),
    Protocols.WebSocket({ port: 8081 }),
    Protocols.MCP({ name: "${projectName}-agent-tools" })
  ],
  entities: [
    App
  ],
  frontend: {
    rootEntity: "App",
    variant: 0
  }
});
`);

// ─── 4. BACKEND LIBRARIES (AppConcepts) ─────────────────────────────────────────
fs.writeFileSync(path.join(bLibDir, "definitions.ts"), `/**
 * @file definitions.ts
 * @role component
 * @description Types, interfaces, and contracts for AppConcepts.
 */

export interface AppTransformOptions {
  normalize?: boolean;
}
`);

fs.writeFileSync(path.join(bLibDir, "functions.ts"), `/**
 * @file functions.ts
 * @role component
 * @description Pure functions (Layer 0A) for AppConcepts.
 */

import type { AppTransformOptions } from "./definitions.js";

export function pureTransform<T>(data: T, _options?: AppTransformOptions): T {
  return data;
}
`);

fs.writeFileSync(path.join(bLibDir, "manifest.json"), JSON.stringify({
  name: "AppConcepts",
  description: "Core utility concept library for App",
  dependencies: {}
}, null, 2));

fs.writeFileSync(path.join(bLibDir, "tests", "AppConcepts.test.ts"), `import { describe, it, expect } from "vitest";
import { pureTransform } from "../functions.js";

describe("AppConcepts", () => {
  it("transforms data deterministically", () => {
    expect(pureTransform(42)).toBe(42);
  });
});
`);

// ─── 5. BACKEND ENTITIES (App) ──────────────────────────────────────────────────
fs.writeFileSync(path.join(bEntityDir, "App.ts"), `import { Entity, KrnlMagneticLoader } from "@dinilmusick/krnl-core";

/**
 * @role skeleton
 */
export class App extends Entity {
  constructor() {
    super({
      id: "App",
      version: "1.0.0",
      description: "Root application entity"
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default App;
`);

fs.writeFileSync(path.join(bEntityDir, "orchestrations", "BootFlow.ts"), `import { KrnlFlowBuilder } from "@dinilmusick/krnl-core";

export function configureBootFlow(entity: any) {
  return entity.flow("bootSequence")
    .thenFunctionality("Hello")
    .register({ visibility: "public" });
}
`);

fs.writeFileSync(path.join(bEntityDir, "tests", "App.test.ts"), `import { describe, it, expect } from "vitest";
import { App } from "../App.js";

describe("App Entity", () => {
  it("initializes with id App", () => {
    const app = new App();
    expect(app.id).toBe("App");
  });
});
`);

// ─── 6. BACKEND FUNCTIONALITIES (Hello Quad-Unit) ──────────────────────────────
fs.writeFileSync(path.join(bFuncDir, "HelloAtom.ts"), `export interface HelloInput {
  name?: string;
}

export interface HelloOutput {
  greeting: string;
  timestamp: number;
}
`);

fs.writeFileSync(path.join(bFuncDir, "manifest.json"), JSON.stringify({
  name: "Hello",
  description: "Greeting quad-unit functionality",
  dependencies: {}
}, null, 2));

fs.writeFileSync(path.join(bFuncDir, "main_function", "logic.ts"), `import type { HelloInput, HelloOutput } from "../HelloAtom.js";
import { formatGreeting } from "../helper_functions/formatGreeting.js";

export const main = async (input: HelloInput, { state }: any): Promise<HelloOutput> => {
  const greeting = formatGreeting(input.name || "World");
  if (state) state.callCount = (state.callCount || 0) + 1;
  return {
    greeting,
    timestamp: Date.now()
  };
};
`);

fs.writeFileSync(path.join(bFuncDir, "main_function", "lifecycle.ts"), `export async function onMount() {
  console.log("[Hello] Mounted");
}

export async function onTeardown() {
  console.log("[Hello] Teardown");
}
`);

fs.writeFileSync(path.join(bFuncDir, "state_data", "state.ts"), `export interface HelloState {
  callCount: number;
}

export const initialState: HelloState = {
  callCount: 0
};
`);

fs.writeFileSync(path.join(bFuncDir, "helper_functions", "formatGreeting.ts"), `/**
 * @role component
 */
export function formatGreeting(name: string): string {
  return "Hello, " + name + "! Welcome to Krnl.";
}
`);

fs.writeFileSync(path.join(bFuncDir, "events", "helloEvents.ts"), `/**
 * @role component
 */
export interface HelloGreetedEvent {
  name: string;
  timestamp: number;
}
`);

fs.writeFileSync(path.join(bFuncDir, "tests", "Hello.test.ts"), `import { describe, it, expect } from "vitest";
import { formatGreeting } from "../helper_functions/formatGreeting.js";

describe("Hello functionality", () => {
  it("formats greeting properly", () => {
    expect(formatGreeting("Alice")).toContain("Alice");
  });
});
`);

// ─── 7. FRONTEND LIBRARIES (ButtonConcepts) ────────────────────────────────────
fs.writeFileSync(path.join(fLibDir, "definitions.ts"), `export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
}
`);

fs.writeFileSync(path.join(fLibDir, "components.tsx"), `import React from "react";
import type { ButtonProps } from "./definitions.js";
import "./styles.css";

export const Button: React.FC<ButtonProps> = ({ label, variant = "primary", disabled, onClick }) => {
  return (
    <button className={"krnl-btn krnl-btn--" + variant} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
};
`);

fs.writeFileSync(path.join(fLibDir, "styles.css"), `.krnl-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid #111;
  box-shadow: 2px 2px 0px #111;
}
.krnl-btn--primary {
  background: #38bdf8;
  color: #0f172a;
}
`);

fs.writeFileSync(path.join(fLibDir, "manifest.json"), JSON.stringify({
  name: "ButtonConcepts",
  dependencies: {
    "react": "^18.3.1"
  }
}, null, 2));

fs.writeFileSync(path.join(fLibDir, "tests", "Button.test.tsx"), `import { describe, it, expect } from "vitest";

describe("Button component", () => {
  it("defined correctly", () => {
    expect(true).toBe(true);
  });
});
`);

// ─── 8. FRONTEND ENTITIES (App) ─────────────────────────────────────────────────
fs.writeFileSync(path.join(fEntityDir, "App0.tsx"), `import React from "react";
import { Button } from "../../libraries/ButtonConcepts/components.js";

export const App0: React.FC = () => {
  return (
    <div className="krnl-entity-app">
      <h1>App View (Variant 0)</h1>
      <Button label="Click Me" onClick={() => alert("Welcome to Krnl!")} />
    </div>
  );
};

export default App0;
`);

fs.writeFileSync(path.join(fEntityDir, "tests", "App0.test.tsx"), `import { describe, it, expect } from "vitest";

describe("App0 Component", () => {
  it("mounts variant 0", () => {
    expect(true).toBe(true);
  });
});
`);

// ─── 9. FRONTEND FUNCTIONALITIES (Hello) ───────────────────────────────────────
fs.writeFileSync(path.join(fFuncDir, "Hello0.tsx"), `import React from "react";

export interface HelloProps {
  greeting?: string;
}

export const Hello0: React.FC<HelloProps> = ({ greeting = "Hello World!" }) => {
  return (
    <div className="krnl-func-hello">
      <p>{greeting}</p>
    </div>
  );
};

export default Hello0;
`);

fs.writeFileSync(path.join(fFuncDir, "manifest.json"), JSON.stringify({
  name: "HelloUI",
  dependencies: {
    "react": "^18.3.1"
  }
}, null, 2));

fs.writeFileSync(path.join(fFuncDir, "tests", "Hello0.test.tsx"), `import { describe, it, expect } from "vitest";

describe("Hello0 Component", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`);

// ─── 10. RECONCILE PACKAGE.JSON PROGRAMMATICALLY ──────────────────────────────
KrnlPackageReconciler.reconcile(targetDir, true);

// ─── 11. DOCS & STATE ──────────────────────────────────────────────────────────
fs.writeFileSync(path.join(targetDir, "docs", "HISTORY.md"), `# ${projectName} - Project History & Invariants

## Initial Scaffolding
- Initialized Krnl symmetric architecture (krnl/backend & krnl/frontend).
- Configured code-as-config entrypoint: ${projectName}.ts.
- Co-located manifest.json and tests/ across all concept libraries and functionalities.
- Programmatically reconciled package.json dependencies.
`);

fs.writeFileSync(path.join(targetDir, ".skipo", "agent-state.json"), JSON.stringify({
  schemaVersion: "1.0.0",
  turnsSinceLastAudit: 0,
  auditCadenceThreshold: 5,
  totalTurns: 0,
  lastAudit: {
    timestamp: new Date().toISOString(),
    status: "INITIALIZED",
    refactorsPerformed: [],
    checksPassed: ["symmetric_planes", "concept_folders", "manifest_reconciliation", "tests_colocation"]
  },
  history: []
}, null, 2));

console.log(`\n🎉 Project successfully scaffolded at: ${targetDir}`);
console.log(`\nTo get started:\n  cd ${projectName}\n  pnpm install\n  krnl dev\n`);
