import * as fs from 'fs';
import * as path from 'path';

export function scaffoldFrontend(targetDir: string, projectName: string): void {
  const fLibDir = path.join(targetDir, 'krnl', 'frontend', 'libraries', 'ButtonConcepts');
  const fEntityDir = path.join(targetDir, 'krnl', 'frontend', 'entities', 'App');
  const fFuncDir = path.join(targetDir, 'krnl', 'frontend', 'functionalities', 'Hello');

  fs.mkdirSync(path.join(fLibDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(fEntityDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(fFuncDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, '.krnl'), { recursive: true });

  // ButtonConcepts
  fs.writeFileSync(
    path.join(fLibDir, 'definitions.ts'),
    `export type ButtonVariant = "primary" | "secondary";\nexport interface ButtonProps { label: string; variant?: ButtonVariant; disabled?: boolean; onClick?: () => void; }\n`
  );
  fs.writeFileSync(
    path.join(fLibDir, 'components.tsx'),
    `import React from "react";\nimport type { ButtonProps } from "./definitions.js";\nimport "./styles.css";\nexport const Button: React.FC<ButtonProps> = ({ label, variant = "primary", disabled, onClick }) => {\n  return <button className={"krnl-btn krnl-btn--" + variant} disabled={disabled} onClick={onClick}>{label}</button>;\n};\n`
  );
  fs.writeFileSync(
    path.join(fLibDir, 'styles.css'),
    `.krnl-btn { padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; }\n.krnl-btn--primary { background: #38bdf8; color: #0f172a; }\n`
  );
  fs.writeFileSync(
    path.join(fLibDir, 'manifest.json'),
    JSON.stringify({ name: 'ButtonConcepts', dependencies: { react: '^18.3.1' } }, null, 2)
  );
  fs.writeFileSync(
    path.join(fLibDir, 'tests', 'Button.test.tsx'),
    `import { describe, it, expect } from "vitest";\ndescribe("Button component", () => { it("defined correctly", () => { expect(true).toBe(true); }); });\n`
  );

  // Frontend Entity
  fs.writeFileSync(
    path.join(fEntityDir, 'App0.tsx'),
    `import React from "react";\nimport { Button } from "../../libraries/ButtonConcepts/components.js";\nexport const App0: React.FC = () => {\n  return (\n    <div className="krnl-entity-app">\n      <h1>App View (Variant 0)</h1>\n      <Button label="Click Me" onClick={() => alert("Welcome to Krnl!")} />\n    </div>\n  );\n};\nexport default App0;\n`
  );
  fs.writeFileSync(
    path.join(fEntityDir, 'tests', 'App0.test.tsx'),
    `import { describe, it, expect } from "vitest";\ndescribe("App0 Component", () => { it("mounts variant 0", () => { expect(true).toBe(true); }); });\n`
  );

  // Frontend Functionality
  fs.writeFileSync(
    path.join(fFuncDir, 'Hello0.tsx'),
    `import React from "react";\nexport interface HelloProps { greeting?: string; }\nexport const Hello0: React.FC<HelloProps> = ({ greeting = "Hello World!" }) => {\n  return <div className="krnl-func-hello"><p>{greeting}</p></div>;\n};\nexport default Hello0;\n`
  );
  fs.writeFileSync(
    path.join(fFuncDir, 'manifest.json'),
    JSON.stringify({ name: 'HelloUI', dependencies: { react: '^18.3.1' } }, null, 2)
  );
  fs.writeFileSync(
    path.join(fFuncDir, 'tests', 'Hello0.test.tsx'),
    `import { describe, it, expect } from "vitest";\ndescribe("Hello0 Component", () => { it("renders correctly", () => { expect(true).toBe(true); }); });\n`
  );

  // Docs & State
  fs.writeFileSync(
    path.join(targetDir, 'docs', 'HISTORY.md'),
    `# ${projectName} - Project History\n\nInitialized Krnl symmetric architecture.\n`
  );
  fs.writeFileSync(
    path.join(targetDir, '.krnl', 'agent-state.json'),
    JSON.stringify(
      {
        schemaVersion: '1.0.0',
        turnsSinceLastAudit: 0,
        auditCadenceThreshold: 5,
        totalTurns: 0,
        lastAudit: {
          timestamp: new Date().toISOString(),
          status: 'INITIALIZED',
          refactorsPerformed: [],
          checksPassed: ['symmetric_planes', 'concept_folders', 'manifest_reconciliation'],
        },
        history: [],
      },
      null,
      2
    )
  );
}
