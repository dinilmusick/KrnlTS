import * as fs from 'fs';
import * as path from 'path';

export function scaffoldBackend(targetDir: string): void {
  const bLibDir = path.join(targetDir, 'krnl', 'backend', 'libraries', 'AppConcepts');
  const bEntityDir = path.join(targetDir, 'krnl', 'backend', 'entities', 'App');
  const bFuncDir = path.join(targetDir, 'krnl', 'backend', 'functionalities', 'Hello');

  fs.mkdirSync(path.join(bLibDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(bEntityDir, 'orchestrations'), { recursive: true });
  fs.mkdirSync(path.join(bEntityDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'main_function'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'state_data'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'helper_functions'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'events'), { recursive: true });
  fs.mkdirSync(path.join(bFuncDir, 'tests'), { recursive: true });

  // AppConcepts
  fs.writeFileSync(
    path.join(bLibDir, 'definitions.ts'),
    `export interface AppTransformOptions { normalize?: boolean; }\n`
  );
  fs.writeFileSync(
    path.join(bLibDir, 'functions.ts'),
    `import type { AppTransformOptions } from "./definitions.js";\nexport function pureTransform<T>(data: T, _options?: AppTransformOptions): T { return data; }\n`
  );
  fs.writeFileSync(
    path.join(bLibDir, 'manifest.json'),
    JSON.stringify({ name: 'AppConcepts', description: 'Core utility concept library for App', dependencies: {} }, null, 2)
  );
  fs.writeFileSync(
    path.join(bLibDir, 'tests', 'AppConcepts.test.ts'),
    `import { describe, it, expect } from "vitest";\nimport { pureTransform } from "../functions.js";\ndescribe("AppConcepts", () => { it("transforms data", () => { expect(pureTransform(42)).toBe(42); }); });\n`
  );

  // App Entity
  fs.writeFileSync(
    path.join(bEntityDir, 'App.ts'),
    `import { Entity, KrnlMagneticLoader } from "@ultrst-armada/krnl-core";\nexport class App extends Entity {\n  constructor() { super({ id: "App", version: "1.0.0", description: "Root application entity" }); }\n  async boot(): Promise<void> { await KrnlMagneticLoader.loadAll(this, import.meta.url); }\n}\nexport default App;\n`
  );
  fs.writeFileSync(
    path.join(bEntityDir, 'orchestrations', 'BootFlow.ts'),
    `export function configureBootFlow(entity: any) {\n  return entity.flow("bootSequence").thenFunctionality("Hello").register({ visibility: "public" });\n}\n`
  );
  fs.writeFileSync(
    path.join(bEntityDir, 'tests', 'App.test.ts'),
    `import { describe, it, expect } from "vitest";\nimport { App } from "../App.js";\ndescribe("App Entity", () => { it("initializes with id App", () => { expect(new App().id).toBe("App"); }); });\n`
  );

  // Hello Functionality
  fs.writeFileSync(
    path.join(bFuncDir, 'HelloAtom.ts'),
    `export interface HelloInput { name?: string; }\nexport interface HelloOutput { greeting: string; timestamp: number; }\n`
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'manifest.json'),
    JSON.stringify({ name: 'Hello', description: 'Greeting quad-unit functionality', dependencies: {} }, null, 2)
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'main_function', 'logic.ts'),
    `import type { HelloInput, HelloOutput } from "../HelloAtom.js";\nimport { formatGreeting } from "../helper_functions/formatGreeting.js";\nexport const main = async (input: HelloInput, { state }: any): Promise<HelloOutput> => {\n  const greeting = formatGreeting(input.name || "World");\n  if (state) state.callCount = (state.callCount || 0) + 1;\n  return { greeting, timestamp: Date.now() };\n};\n`
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'main_function', 'lifecycle.ts'),
    `export async function onMount() {}\nexport async function onTeardown() {}\n`
  );
  fs.writeFileSync(
    path.join(bFuncDir, 'state_data', 'state.ts'),
    `export interface HelloState { callCount: number; }\nexport const initialState: HelloState = { callCount: 0 };\n`
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
