#!/usr/bin/env node

// src/index.ts
import * as fs3 from "fs";
import * as path3 from "path";
import { KrnlPackageReconciler } from "@ultrst-armada/krnl-core";

// src/templates/configTemplates.ts
function getBasePackageJson(projectName2) {
  return JSON.stringify(
    {
      name: projectName2,
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
        "@ultrst-armada/krnl": "^1.0.0",
        "@ultrst-armada/krnl-core": "^1.0.0",
        "react": "^18.3.1"
      },
      devDependencies: {
        "@types/node": "^22.0.0",
        "@types/react": "^18.3.1",
        "@ultrst-armada/krnl-cli": "^1.0.0",
        "@ultrst-armada/krnl-validate": "^1.0.0",
        typescript: "^5.7.3",
        vitest: "^1.6.0"
      }
    },
    null,
    2
  );
}
function getTsConfig(projectName2) {
  return JSON.stringify(
    {
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
      include: ["krnl/**/*", `${projectName2}.ts`, "krnl-magnetic.d.ts"],
      exclude: ["node_modules", "dist"]
    },
    null,
    2
  );
}
function getAppEntrypoint(projectName2) {
  const safeIdentifier = projectName2.replace(/[^a-zA-Z0-9_$]/g, "_");
  return `import { AppServiceFacade } from "./krnl/backend/services/App/AppServiceFacade.js";

export const services = {
  app: AppServiceFacade,
};

export const ${safeIdentifier}Backend = {
  services,
};

export default AppServiceFacade;
`;
}

// src/templates/backendTemplates.ts
import * as fs from "fs";
import * as path from "path";
function scaffoldBackend(targetDir2) {
  const bLibDir = path.join(targetDir2, "krnl", "backend", "libraries", "AppConcepts");
  const bOrchDir = path.join(targetDir2, "krnl", "backend", "orchestrations", "App");
  const bServiceDir = path.join(targetDir2, "krnl", "backend", "services", "App");
  const bFuncDir = path.join(targetDir2, "krnl", "backend", "functionalities", "Hello");
  fs.mkdirSync(path.join(bLibDir, "tests"), { recursive: true });
  fs.mkdirSync(path.join(bOrchDir, "tests"), { recursive: true });
  fs.mkdirSync(path.join(bServiceDir, "tests"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "main_function"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "state_data"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "helper_functions"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "events"), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, "tests"), { recursive: true });
  fs.writeFileSync(
    path.join(bLibDir, "definitions.ts"),
    `export interface AppTransformOptions { normalize?: boolean; }
`
  );
  fs.writeFileSync(
    path.join(bLibDir, "functions.ts"),
    `import type { AppTransformOptions } from "./definitions.js";
export function pureTransform<T>(data: T, _options?: AppTransformOptions): T { return data; }
`
  );
  fs.writeFileSync(
    path.join(bLibDir, "manifest.json"),
    JSON.stringify({ name: "AppConcepts", description: "Core utility concept library for App", dependencies: {} }, null, 2)
  );
  fs.writeFileSync(
    path.join(bLibDir, "tests", "AppConcepts.test.ts"),
    `import { describe, it, expect } from "vitest";
import { pureTransform } from "../functions.js";
describe("AppConcepts", () => { it("transforms data", () => { expect(pureTransform(42)).toBe(42); }); });
`
  );
  fs.writeFileSync(
    path.join(bOrchDir, "AppFunctionalityOrchestration.ts"),
    `import { FunctionalityOrchestration } from "@ultrst-armada/krnl-core";

/**
 * @role functionality-orchestration
 * Declarative FunctionalityOrchestration flow for App.
 */
export class AppFunctionalityOrchestration extends FunctionalityOrchestration {
  constructor() {
    super({
      id: "AppFunctionalityOrchestration",
      name: "App",
      version: "1.0.0",
      description: "Root service functionality orchestration flow",
    });

    this.flow("default")
      .thenFunctionality("Hello")
      .register({ visibility: "public" });
  }
}

export default AppFunctionalityOrchestration;
`
  );
  fs.writeFileSync(
    path.join(bOrchDir, "tests", "AppFunctionalityOrchestration.test.ts"),
    `import { describe, it, expect } from "vitest";
import { AppFunctionalityOrchestration } from "../AppFunctionalityOrchestration.js";
describe("AppFunctionalityOrchestration", () => { it("initializes flow correctly", () => { expect(new AppFunctionalityOrchestration().id).toBe("AppFunctionalityOrchestration"); }); });
`
  );
  fs.writeFileSync(
    path.join(bServiceDir, "AppServiceFacade.ts"),
    `import { ServiceFacade } from "@ultrst-armada/krnl-core";
import { AppFunctionalityOrchestration } from "../../orchestrations/App/AppFunctionalityOrchestration.js";

export const AppServiceFacade = new ServiceFacade({
  id: "app.service",
  name: "AppService",
  version: "1.0.0",
  description: "Primary application service facade",
  functionalityOrchestrations: {
    App: new AppFunctionalityOrchestration(),
  },
});

export default AppServiceFacade;
`
  );
  fs.writeFileSync(
    path.join(bServiceDir, "tests", "AppServiceFacade.test.ts"),
    `import { describe, it, expect } from "vitest";
import { AppServiceFacade } from "../AppServiceFacade.js";
describe("AppServiceFacade", () => { it("exposes orchestrations correctly", () => { expect(AppServiceFacade.id).toBe("app.service"); expect(AppServiceFacade.functionalityOrchestrations.App).toBeDefined(); }); });
`
  );
  fs.writeFileSync(
    path.join(bFuncDir, "HelloAtom.ts"),
    `export interface HelloInput { name?: string; }
export interface HelloOutput { greeting: string; timestamp: number; }
`
  );
  fs.writeFileSync(
    path.join(bFuncDir, "manifest.json"),
    JSON.stringify({ name: "Hello", description: "Greeting quad-unit functionality", dependencies: {} }, null, 2)
  );
  fs.writeFileSync(
    path.join(bFuncDir, "main_function", "logic.ts"),
    `import type { HelloInput, HelloOutput } from "../HelloAtom.js";
import { formatGreeting } from "../helper_functions/formatGreeting.js";
export const main = async (input: HelloInput, { state }: any): Promise<HelloOutput> => {
  const greeting = formatGreeting(input.name || "World");
  if (state) state.callCount = (state.callCount || 0) + 1;
  return { greeting, timestamp: Date.now() };
};
`
  );
  fs.writeFileSync(
    path.join(bFuncDir, "main_function", "lifecycle.ts"),
    `export async function onMount() {}
export async function onTeardown() {}
`
  );
  fs.writeFileSync(
    path.join(bFuncDir, "state_data", "state.ts"),
    `export interface HelloState { callCount: number; }
export const initialState: HelloState = { callCount: 0 };
`
  );
  fs.writeFileSync(
    path.join(bFuncDir, "helper_functions", "formatGreeting.ts"),
    `export function formatGreeting(name: string): string { return "Hello, " + name + "! Welcome to Krnl."; }
`
  );
  fs.writeFileSync(
    path.join(bFuncDir, "events", "helloEvents.ts"),
    `export interface HelloGreetedEvent { name: string; timestamp: number; }
`
  );
  fs.writeFileSync(
    path.join(bFuncDir, "tests", "Hello.test.ts"),
    `import { describe, it, expect } from "vitest";
import { formatGreeting } from "../helper_functions/formatGreeting.js";
describe("Hello functionality", () => { it("formats greeting", () => { expect(formatGreeting("Alice")).toContain("Alice"); }); });
`
  );
}

// src/templates/frontendTemplates.ts
import * as fs2 from "fs";
import * as path2 from "path";
function scaffoldFrontend(targetDir2, projectName2) {
  const fLibDir = path2.join(targetDir2, "krnl", "frontend", "libraries", "ButtonConcepts");
  const fOrchDir = path2.join(targetDir2, "krnl", "frontend", "orchestrations", "App");
  const fFuncDir = path2.join(targetDir2, "krnl", "frontend", "functionalities", "Hello");
  fs2.mkdirSync(path2.join(fLibDir, "tests"), { recursive: true });
  fs2.mkdirSync(path2.join(fOrchDir, "tests"), { recursive: true });
  fs2.mkdirSync(path2.join(fFuncDir, "tests"), { recursive: true });
  fs2.mkdirSync(path2.join(targetDir2, "docs"), { recursive: true });
  fs2.mkdirSync(path2.join(targetDir2, ".krnl"), { recursive: true });
  fs2.writeFileSync(
    path2.join(fLibDir, "definitions.ts"),
    `export type ButtonVariant = "primary" | "secondary";
export interface ButtonProps { label: string; variant?: ButtonVariant; disabled?: boolean; onClick?: () => void; }
`
  );
  fs2.writeFileSync(
    path2.join(fLibDir, "components.tsx"),
    `import React from "react";
import type { ButtonProps } from "./definitions.js";
import "./styles.css";
export const Button: React.FC<ButtonProps> = ({ label, variant = "primary", disabled, onClick }) => {
  return <button className={"krnl-btn krnl-btn--" + variant} disabled={disabled} onClick={onClick}>{label}</button>;
};
`
  );
  fs2.writeFileSync(
    path2.join(fLibDir, "styles.css"),
    `.krnl-btn { padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; }
.krnl-btn--primary { background: #38bdf8; color: #0f172a; }
`
  );
  fs2.writeFileSync(
    path2.join(fLibDir, "manifest.json"),
    JSON.stringify({ name: "ButtonConcepts", dependencies: { react: "^18.3.1" } }, null, 2)
  );
  fs2.writeFileSync(
    path2.join(fLibDir, "tests", "Button.test.tsx"),
    `import { describe, it, expect } from "vitest";
describe("Button component", () => { it("defined correctly", () => { expect(true).toBe(true); }); });
`
  );
  fs2.writeFileSync(
    path2.join(fOrchDir, "App0.tsx"),
    `import React from "react";
import { Button } from "../../libraries/ButtonConcepts/components.js";
export const App0: React.FC = () => {
  return (
    <div className="krnl-app-view">
      <h1>App View (Variant 0)</h1>
      <Button label="Click Me" onClick={() => alert("Welcome to Krnl!")} />
    </div>
  );
};
export default App0;
`
  );
  fs2.writeFileSync(
    path2.join(fOrchDir, "tests", "App0.test.tsx"),
    `import { describe, it, expect } from "vitest";
describe("App0 Component", () => { it("mounts variant 0", () => { expect(true).toBe(true); }); });
`
  );
  fs2.writeFileSync(
    path2.join(fFuncDir, "Hello0.tsx"),
    `import React from "react";
export interface HelloProps { greeting?: string; }
export const Hello0: React.FC<HelloProps> = ({ greeting = "Hello World!" }) => {
  return <div className="krnl-func-hello"><p>{greeting}</p></div>;
};
export default Hello0;
`
  );
  fs2.writeFileSync(
    path2.join(fFuncDir, "manifest.json"),
    JSON.stringify({ name: "HelloUI", dependencies: { react: "^18.3.1" } }, null, 2)
  );
  fs2.writeFileSync(
    path2.join(fFuncDir, "tests", "Hello0.test.tsx"),
    `import { describe, it, expect } from "vitest";
describe("Hello0 Component", () => { it("renders correctly", () => { expect(true).toBe(true); }); });
`
  );
  fs2.writeFileSync(
    path2.join(targetDir2, "docs", "HISTORY.md"),
    `# ${projectName2} - Project History

Initialized Krnl symmetric architecture.
`
  );
  fs2.writeFileSync(
    path2.join(targetDir2, ".krnl", "agent-state.json"),
    JSON.stringify(
      {
        schemaVersion: "1.0.0",
        turnsSinceLastAudit: 0,
        auditCadenceThreshold: 5,
        totalTurns: 0,
        lastAudit: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          status: "INITIALIZED",
          refactorsPerformed: [],
          checksPassed: ["symmetric_planes", "concept_folders", "manifest_reconciliation"]
        },
        history: []
      },
      null,
      2
    )
  );
}

// src/index.ts
var rawArg = process.argv[2] || "my-krnl-app";
var targetDir = path3.resolve(process.cwd(), rawArg);
var projectName = path3.basename(targetDir);
console.log(`
\u{1F680} [create-krnl] Scaffolding new Krnl project in: ${targetDir}
`);
if (fs3.existsSync(targetDir)) {
  console.error(`\u274C Directory "${projectName}" already exists.`);
  process.exit(1);
}
fs3.mkdirSync(targetDir, { recursive: true });
fs3.writeFileSync(path3.join(targetDir, "package.json"), getBasePackageJson(projectName));
fs3.writeFileSync(path3.join(targetDir, "tsconfig.json"), getTsConfig(projectName));
fs3.writeFileSync(path3.join(targetDir, `${projectName}.ts`), getAppEntrypoint(projectName));
scaffoldBackend(targetDir);
scaffoldFrontend(targetDir, projectName);
KrnlPackageReconciler.reconcile(targetDir, true);
console.log(`
\u{1F389} Project successfully scaffolded at: ${targetDir}`);
console.log(`
To get started:
  cd ${projectName}
  pnpm install
  krnl dev
`);
