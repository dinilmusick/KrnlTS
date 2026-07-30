// src/krnl/core/K_LIB_Krnl_Frontend_Generator.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var _metaUrl = typeof import.meta !== "undefined" && import.meta.url ? import.meta.url : null;
var _filename = _metaUrl ? fileURLToPath(_metaUrl) : "";
var _dirname = _metaUrl ? path.dirname(_filename) : "";
var KrnlFrontendGenerator = class {
  /**
   * Main entrypoint: ensures skeleton exists, generates React components & index.tsx
   */
  static async generate(entity, frontendDir) {
    this.ensureFrontendSkeleton(entity, frontendDir);
    const uiEndpoints = [];
    const allFuncs = [
      ...entity.localFunctionalities?.values() || [],
      ...entity.remoteFunctionalities?.values() || []
    ];
    for (const fn of allFuncs) {
      const uiSpec = fn.uiSpec || fn.ui_spec;
      if (uiSpec && uiSpec.ui_component_enabled) {
        uiEndpoints.push({ id: fn.id, uiSpec, schema: fn.schema });
      }
    }
    if (uiEndpoints.length > 0) {
      this.checkReactDependencies(frontendDir);
    }
    const componentsDir = path.join(frontendDir, "src", "components");
    fs.mkdirSync(componentsDir, { recursive: true });
    for (const ep of uiEndpoints) {
      const epDir = path.join(componentsDir, ep.id);
      fs.mkdirSync(epDir, { recursive: true });
      const compSource = this.generateComponentSource(ep.id, ep.uiSpec, ep.schema);
      fs.writeFileSync(path.join(epDir, "index.tsx"), compSource, "utf-8");
    }
    const subAppPrefixes = Array.from(entity._subAppRegistry?.keys() || []);
    const indexSource = this.generateIndexSource(entity.entityName, uiEndpoints, subAppPrefixes);
    fs.writeFileSync(path.join(frontendDir, "src", "index.tsx"), indexSource, "utf-8");
  }
  /**
   * Ensures essential files (package.json, index.html, index.css, atoms/) exist in frontendDir
   */
  static ensureFrontendSkeleton(entity, frontendDir) {
    const srcDir = path.join(frontendDir, "src");
    const atomsDir = path.join(srcDir, "atoms");
    fs.mkdirSync(atomsDir, { recursive: true });
    const libAtomsDir = path.resolve(_dirname, "../frontend/atoms");
    if (fs.existsSync(libAtomsDir)) {
      const files = fs.readdirSync(libAtomsDir);
      for (const file of files) {
        const srcFile = path.join(libAtomsDir, file);
        const destFile = path.join(atomsDir, file);
        fs.copyFileSync(srcFile, destFile);
      }
    }
    const pkgPath = path.join(frontendDir, "package.json");
    if (!fs.existsSync(pkgPath)) {
      const pkgContent = {
        name: `${entity.entityName.toLowerCase()}-frontend`,
        version: "1.0.0",
        type: "module",
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0"
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0"
        }
      };
      fs.writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2), "utf-8");
    }
    const htmlPath = path.join(frontendDir, "index.html");
    if (!fs.existsSync(htmlPath)) {
      const htmlContent = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${entity.entityName} Frontend</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script src="bundle.js"></script>
</body>
</html>`;
      fs.writeFileSync(htmlPath, htmlContent, "utf-8");
    }
    const cssPath = path.join(frontendDir, "index.css");
    if (!fs.existsSync(cssPath)) {
      const defaultCss = `:root {
  --krnl-font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  --krnl-font-mono: 'JetBrains Mono', monospace;
  --krnl-bg-base: #0a0e17;
  --krnl-bg-surface: rgba(22, 28, 45, 0.65);
  --krnl-border-color: rgba(255, 255, 255, 0.08);
  --krnl-text-main: #f8fafc;
  --krnl-text-muted: #94a3b8;
  --krnl-primary: #3b82f6;
  --krnl-primary-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  --krnl-accent: #10b981;
  --krnl-danger: #ef4444;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--krnl-font-sans); background: var(--krnl-bg-base); color: var(--krnl-text-main); }
`;
      fs.writeFileSync(cssPath, defaultCss, "utf-8");
    }
  }
  /**
   * Verifies React dependencies are installed in frontend/
   */
  static checkReactDependencies(frontendDir) {
    const nodeModulesReact = path.join(frontendDir, "node_modules", "react");
    const rootNodeModulesReact = path.resolve(frontendDir, "../../node_modules/react");
    if (!fs.existsSync(nodeModulesReact) && !fs.existsSync(rootNodeModulesReact)) {
      console.error(`
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 [KrnlFrontend] WARNING: UI components are enabled but React is missing! \u2502
\u2502 Please run inside your frontend/ directory:                             \u2502
\u2502   npm install react react-dom                                           \u2502
\u2502   npm install -D @types/react @types/react-dom                         \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
`);
    }
  }
  /**
   * Generates TSX source code for a single endpoint UI component
   */
  static generateComponentSource(fid, uiSpec, schema) {
    const inputs = uiSpec.inputs || [];
    const outputs = uiSpec.outputs || [];
    const atomImports = /* @__PURE__ */ new Set();
    atomImports.add("KrnlButton");
    inputs.forEach((i) => atomImports.add(i.component));
    outputs.forEach((o) => atomImports.add(o.component));
    const importStatement = `import { ${Array.from(atomImports).join(", ")} } from '../../atoms/index.js';`;
    return `import React, { useState, useEffect } from 'react';
${importStatement}

export default function Endpoint_${fid.replace(/[^a-zA-Z0-9]/g, "_")}() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phantomActive, setPhantomActive] = useState(false);

  // Subscribe to live SSE events for phantom mirroring
  useEffect(() => {
    const sse = new EventSource('/sse/${fid}');
    sse.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'frontend:interaction' || msg.input !== undefined) {
          if (msg.input) setFormData((prev) => ({ ...prev, ...msg.input }));
          if (msg.output !== undefined) setResponse(msg.output?.payload !== undefined ? msg.output.payload : msg.output);
          setPhantomActive(true);
          setTimeout(() => setPhantomActive(false), 2000);
        }
      } catch (e) {}
    };
    return () => sse.close();
  }, []);

  const handleInputChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('api/${fid}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResponse(data.payload !== undefined ? data.payload : data);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={\`krnl-endpoint-card \${phantomActive ? 'krnl-phantom-active' : ''}\`}
      style={{
        background: 'var(--krnl-bg-surface)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: phantomActive ? '2px solid var(--krnl-accent)' : '1px solid var(--krnl-border-color)',
        transition: 'all 0.3s ease',
        boxShadow: phantomActive ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
        position: 'relative'
      }}
    >
      {phantomActive && (
        <div className="krnl-phantom-badge" style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--krnl-accent)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          \u{1F916} Phantom Execution Active
        </div>
      )}
      <h3 style={{ marginBottom: '1rem', color: 'var(--krnl-primary)' }}>Endpoint: ${fid}</h3>
      <form onSubmit={handleSubmit}>
        ${inputs.map((inSpec) => this.renderInputAtom(inSpec)).join("\n        ")}
        <KrnlButton type="submit" disabled={loading}>
          {loading ? 'Executing...' : 'Execute ${fid}'}
        </KrnlButton>
      </form>

      {error && <div style={{ color: 'var(--krnl-danger)', marginTop: '1rem' }}>Error: {error}</div>}

      {response !== null && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--krnl-border-color)', paddingTop: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem', color: 'var(--krnl-accent)' }}>Output Response</h4>
          ${outputs.length > 0 ? outputs.map((outSpec) => this.renderOutputAtom(outSpec)).join("\n          ") : `<KrnlJsonViewer data={response} />`}
        </div>
      )}
    </div>
  );
}
`;
  }
  static renderInputAtom(spec) {
    const label = spec.label || spec.field;
    switch (spec.component) {
      case "KrnlTextInput":
        return `<KrnlTextInput label="${label}" value={formData['${spec.field}'] || ''} onChange={(v) => handleInputChange('${spec.field}', v)} placeholder="${spec.placeholder || ""}" />`;
      case "KrnlNumberInput":
        return `<KrnlNumberInput label="${label}" value={formData['${spec.field}'] || ''} onChange={(v) => handleInputChange('${spec.field}', v)} placeholder="${spec.placeholder || ""}" />`;
      case "KrnlToggle":
        return `<KrnlToggle label="${label}" value={!!formData['${spec.field}']} onChange={(v) => handleInputChange('${spec.field}', v)} />`;
      case "KrnlDropdown":
        const opts = JSON.stringify(spec.options || []);
        return `<KrnlDropdown label="${label}" value={formData['${spec.field}'] || ''} options={${opts}} onChange={(v) => handleInputChange('${spec.field}', v)} />`;
      case "KrnlTextArea":
        return `<KrnlTextArea label="${label}" value={formData['${spec.field}'] || ''} onChange={(v) => handleInputChange('${spec.field}', v)} placeholder="${spec.placeholder || ""}" />`;
      case "KrnlJsonInput":
        return `<KrnlJsonInput label="${label}" onChange={(v) => handleInputChange('${spec.field}', v)} />`;
      case "KrnlSSELog":
        return `<KrnlSSELog label="${label}" endpointId="${spec.field}" />`;
      default:
        return `<KrnlTextInput label="${label}" value={formData['${spec.field}'] || ''} onChange={(v) => handleInputChange('${spec.field}', v)} />`;
    }
  }
  static renderOutputAtom(spec) {
    const label = spec.label || spec.field;
    switch (spec.component) {
      case "KrnlJsonViewer":
        return `<KrnlJsonViewer label="${label}" data={response['${spec.field}'] !== undefined ? response['${spec.field}'] : response} />`;
      case "KrnlCarousel":
        return `<KrnlCarousel label="${label}" items={Array.isArray(response['${spec.field}']) ? response['${spec.field}'] : (Array.isArray(response) ? response : [response])} />`;
      case "KrnlTile":
        return `<KrnlTile title="${label}" value={String(response['${spec.field}'] !== undefined ? response['${spec.field}'] : response)} />`;
      case "KrnlSSELog":
        return `<KrnlSSELog label="${label}" endpointId="${spec.field}" />`;
      default:
        return `<KrnlJsonViewer label="${label}" data={response['${spec.field}'] !== undefined ? response['${spec.field}'] : response} />`;
    }
  }
  /**
   * Generates the root index.tsx aggregator with tabs for App components + Sub-Apps
   */
  static generateIndexSource(appName, uiEndpoints, subAppPrefixes) {
    const imports = uiEndpoints.map(
      (ep) => `import Endpoint_${ep.id.replace(/[^a-zA-Z0-9]/g, "_")} from './components/${ep.id}/index.js';`
    ).join("\n");
    return `import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
${imports}

function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('${uiEndpoints.length > 0 ? uiEndpoints[0].id : subAppPrefixes.length > 0 ? subAppPrefixes[0] : "welcome"}');

  return (
    <div className="krnl-app-shell">
      <header className="krnl-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>\u{1F537}</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>${appName}</h1>
        </div>
      </header>

      <div className="krnl-nav-tabs">
        ${uiEndpoints.map(
      (ep) => `<button className={\`krnl-tab-btn \${activeTab === '${ep.id}' ? 'active' : ''}\`} onClick={() => setActiveTab('${ep.id}')}>${ep.id}</button>`
    ).join("\n        ")}
        ${subAppPrefixes.map(
      (sub) => `<button className={\`krnl-tab-btn \${activeTab === '${sub}' ? 'active' : ''}\`} onClick={() => setActiveTab('${sub}')}>\u{1F4E6} ${sub}</button>`
    ).join("\n        ")}
      </div>

      <main className="krnl-main-body">
        ${uiEndpoints.map(
      (ep) => `{activeTab === '${ep.id}' && <Endpoint_${ep.id.replace(/[^a-zA-Z0-9]/g, "_")} />}`
    ).join("\n        ")}
        ${subAppPrefixes.map(
      (sub) => `{activeTab === '${sub}' && (
          <iframe
            src="/frontend/subapps/${sub}/"
            title="${sub}"
            style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none', borderRadius: '8px' }}
          />
        )}`
    ).join("\n        ")}
        ${uiEndpoints.length === 0 && subAppPrefixes.length === 0 ? `<div style={{ textAlign: 'center', color: 'var(--krnl-text-muted)', paddingTop: '4rem' }}>
          <h2>Welcome to ${appName}</h2>
          <p style={{ marginTop: '0.5rem' }}>No UI-enabled endpoints or sub-apps registered yet.</p>
        </div>` : ""}
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<AppShell />);
}
`;
  }
};

export {
  KrnlFrontendGenerator
};
