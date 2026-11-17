import * as fs from 'fs';
import * as path from 'path';

export function scaffoldBackend(targetDir: string): void {
  const bServiceDir = path.join(targetDir, 'krnl', 'backend', 'services', 'App');
  const bLibDir = path.join(bServiceDir, 'libraries', 'AppConcepts');
  const bOrchDir = path.join(bServiceDir, 'orchestrations', 'App');
  const bFuncDir = path.join(bServiceDir, 'functionalities', 'Hello');

  fs.mkdirSync(path.join(bLibDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(bOrchDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(bServiceDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'main_function'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'helper_functions'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'events'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'tests'), { recursive: true });

  // AppConcepts (Service-Owned Library)
  fs.writeFileSync(
    path.join(bLibDir, 'definitions.ts'),
    `export interface AppTransformOptions { normalize?: boolean; }\n`
  );
  fs.writeFileSync(
    path.join(bLibDir, 'functions.ts'),
    `import type { AppTransformOptions } from "./definitions.js";\nexport function appPureTransform<T>(data: T, _options?: AppTransformOptions): T { return data; }\n`
  );
  fs.writeFileSync(
    path.join(bLibDir, 'index.ts'),
    `export * from "./definitions.js";\nexport * from "./functions.js";\n`
  );
  fs.writeFileSync(
    path.join(bLibDir, 'manifest.json'),
    JSON.stringify({ name: 'AppConcepts', service: 'App', description: 'Core utility concept library for App', dependencies: {} }, null, 2)
  );
  fs.writeFileSync(
    path.join(bLibDir, 'tests', 'AppConcepts.test.ts'),
    `import { describe, it, expect } from "vitest";\nimport { appPureTransform } from "../functions.js";\ndescribe("AppConcepts", () => { it("transforms data", () => { expect(appPureTransform(42)).toBe(42); }); });\n`
  );

  // App Functionality Orchestration (Service-Owned)
  fs.writeFileSync(
    path.join(bOrchDir, 'AppFunctionalityOrchestration.ts'),
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
    path.join(bOrchDir, 'tests', 'AppFunctionalityOrchestration.test.ts'),
    `import { describe, it, expect } from "vitest";\nimport { AppFunctionalityOrchestration } from "../AppFunctionalityOrchestration.js";\ndescribe("AppFunctionalityOrchestration", () => { it("initializes flow correctly", () => { expect(new AppFunctionalityOrchestration().id).toBe("AppFunctionalityOrchestration"); }); });\n`
  );

  // App ServiceFacade (Exposing Functionalities, Orchestrations, and Libraries)
  fs.writeFileSync(
    path.join(bServiceDir, 'AppServiceFacade.ts'),
    `import { ServiceFacade } from "@ultrst-armada/krnl-core";
import { AppFunctionalityOrchestration } from "./orchestrations/App/AppFunctionalityOrchestration.js";
import * as appConcepts from "./libraries/AppConcepts/index.js";

export const AppServiceFacade = new ServiceFacade({
  id: "app.service",
  name: "AppService",
  version: "1.0.0",
  description: "Primary application service facade",
  functionalityOrchestrations: {
    App: new AppFunctionalityOrchestration(),
  },
  libraries: {
    AppConcepts: appConcepts,
  },
});

export default AppServiceFacade;
`
  );
  fs.writeFileSync(
    path.join(bServiceDir, 'tests', 'AppServiceFacade.test.ts'),
    `import { describe, it, expect } from "vitest";\nimport { AppServiceFacade } from "../AppServiceFacade.js";\ndescribe("AppServiceFacade", () => {\n  it("exposes orchestrations and libraries correctly", () => {\n    expect(AppServiceFacade.id).toBe("app.service");\n    expect(AppServiceFacade.functionalityOrchestrations.App).toBeDefined();\n    expect(AppServiceFacade.libraries.AppConcepts).toBeDefined();\n    expect(typeof AppServiceFacade.libraries.AppConcepts.appPureTransform).toBe("function");\n  });\n});\n`
  );

  // Hello Functionality (Service-Owned, without forced runtime state)
  fs.writeFileSync(
    path.join(bFuncDir, 'HelloAtom.ts'),
    `export interface HelloInput { name?: string; }\nexport interface HelloOutput { greeting: string; timestamp: number; }\n`
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'manifest.json'),
    JSON.stringify({ name: 'Hello', service: 'App', description: 'Greeting quad-unit functionality', dependencies: {} }, null, 2)
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'main_function', 'logic.ts'),
    `import type { HelloInput, HelloOutput } from "../HelloAtom.js";\nimport { formatGreeting } from "../helper_functions/formatGreeting.js";\nexport const main = async (input: HelloInput, _ctx: any): Promise<HelloOutput> => {\n  const greeting = formatGreeting(input.name || "World");\n  return { greeting, timestamp: Date.now() };\n};\n`
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'main_function', 'lifecycle.ts'),
    `export async function onMount() {}\nexport async function onTeardown() {}\n`
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'helper_functions', 'formatGreeting.ts'),
    `export function formatGreeting(name: string): string { return "Hello, " + name + "! Welcome to Krnl."; }\n`
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'events', 'helloEvents.ts'),
    `export interface HelloGreetedEvent { name: string; timestamp: number; }\n`
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'tests', 'Hello.test.ts'),
    `import { describe, it, expect } from "vitest";\nimport { formatGreeting } from "../helper_functions/formatGreeting.js";\ndescribe("Hello functionality", () => { it("formats greeting", () => { expect(formatGreeting("Alice")).toContain("Alice"); }); });\n`
  );
}
