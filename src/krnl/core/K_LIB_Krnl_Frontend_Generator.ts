import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { KrnlUiSpec, KrnlUiFieldSpec } from './types.js';

const _metaUrl = typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : null;
const _filename = _metaUrl ? fileURLToPath(_metaUrl) : '';
const _dirname = _metaUrl ? path.dirname(_filename) : '';

export class KrnlFrontendGenerator {
  /**
   * Main entrypoint: ensures skeleton exists, generates React components & index.tsx
   */
  static async generate(entity: any, frontendDir: string): Promise<void> {
    this.ensureFrontendSkeleton(entity, frontendDir);

    // Resolve the optional UI endpoint allowlist from frontend options
    const uiAllowlist: string[] | undefined = entity._frontend?.options?.uiEndpoints;

    const uiEndpointsMap = new Map<string, { id: string; uiSpec: KrnlUiSpec; schema: any }>();
    const collectEndpoints = (ent: any) => {
      const funcs = [
        ...(ent.localFunctionalities?.values() || []),
        ...(ent.remoteFunctionalities?.values() || [])
      ];
      for (const fn of funcs) {
        // When an allowlist is specified, skip endpoints not in it immediately
        if (uiAllowlist && !uiAllowlist.includes(fn.id)) {
          continue;
        }

        const uiSpec: KrnlUiSpec = fn.uiSpec || (fn as any).ui_spec;
        // If no explicit uiSpec is set on this functionality, default to disabled.
        // This prevents built-in system endpoints (heartbeat, getTelemetry, etc.)
        // from accidentally appearing in the UI.
        if (!uiSpec) {
          continue;
        }

        if (uiSpec && uiSpec.ui_component_enabled) {
          if (!uiEndpointsMap.has(fn.id)) {
            uiEndpointsMap.set(fn.id, { id: fn.id, uiSpec, schema: fn.schema });
          }
        }
      }
      const children = ent.hierarchyManager?.ownedComponents || ent.components;
      if (children && typeof children.values === 'function') {
        for (const child of children.values()) {
          collectEndpoints(child);
        }
      }
    };

    collectEndpoints(entity);

    const uiEndpoints = Array.from(uiEndpointsMap.values());

    if (uiEndpoints.length > 0) {
      this.checkReactDependencies(frontendDir);
      const contractVal = this.validateExecutionContract(entity, uiEndpoints);
      if (!contractVal.valid) {
        console.error(`[KrnlFrontendGenerator] Execution Contract Validation Failed:\n${contractVal.errors.map(e => ` - ${e}`).join('\n')}`);
        throw new Error(`[KrnlExecutionContractError] ${contractVal.errors.join('; ')}`);
      }
    }

    // Generate atomic reusable components
    this.generateAtoms(frontendDir);

    // Generate individual endpoint components
    const componentsDir = path.join(frontendDir, 'src', 'components');
    fs.mkdirSync(componentsDir, { recursive: true });

    for (const ep of uiEndpoints) {
      const epDir = path.join(componentsDir, ep.id);
      fs.mkdirSync(epDir, { recursive: true });
      const compSource = this.generateComponentSource(ep.id, ep.uiSpec, ep.schema);
      fs.writeFileSync(path.join(epDir, 'index.ts'), compSource, 'utf-8');
    }

    // Generate root index.ts aggregator
    const subAppPrefixesSet = new Set<string>(entity._subAppRegistry?.keys() || []);
    if (entity.hierarchyManager?.ownedComponents) {
      for (const [childId, childEntity] of entity.hierarchyManager.ownedComponents.entries()) {
        if (childEntity && childEntity._frontend) {
          subAppPrefixesSet.add(childId.toLowerCase());
        }
      }
    }
    const subAppPrefixes = Array.from(subAppPrefixesSet);
    const indexSource = this.generateIndexSource(entity.entityName, uiEndpoints, subAppPrefixes);
    fs.writeFileSync(path.join(frontendDir, 'src', 'index.ts'), indexSource, 'utf-8');
  }

  /**
   * Ensures essential files (package.json, index.html, index.css, atoms/) exist in frontendDir
   */
  static ensureFrontendSkeleton(entity: any, frontendDir: string): void {
    const srcDir = path.join(frontendDir, 'src');
    const atomsDir = path.join(srcDir, 'atoms');
    fs.mkdirSync(atomsDir, { recursive: true });

    // Copy atoms from library to app's frontend/src/atoms/
    const candidates = [
      path.resolve(_dirname, '../src/krnl/frontend/atoms'),
      path.resolve(_dirname, '../../src/krnl/frontend/atoms'),
      path.resolve(_dirname, '../frontend/atoms'),
      path.resolve(process.cwd(), 'node_modules/krnlts/src/krnl/frontend/atoms'),
      path.resolve(process.cwd(), 'node_modules/krnlts/dist/frontend/atoms')
    ];
    const libAtomsDir = candidates.find(c => fs.existsSync(c));
    if (libAtomsDir && fs.existsSync(libAtomsDir)) {
      const files = fs.readdirSync(libAtomsDir);
      for (const file of files) {
        const srcFile = path.join(libAtomsDir, file);
        const destFile = path.join(atomsDir, file);
        fs.copyFileSync(srcFile, destFile);
      }
    }

    // Ensure frontend/package.json
    const pkgPath = path.join(frontendDir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      const pkgContent = {
        name: `${entity.entityName.toLowerCase()}-frontend`,
        version: '1.0.0',
        type: 'module',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0'
        }
      };
      fs.writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2), 'utf-8');
    }

    // Ensure frontend/index.html
    const htmlPath = path.join(frontendDir, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      const htmlContent = `<!DOCTYPE html>
<html lang="en" data-theme="glass-brutalism">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${entity.entityName} Frontend</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="/frontend/index.css">
</head>
<body>
  <div class="krnl-sphere krnl-sphere-accent"></div>
  <div class="krnl-sphere krnl-sphere-neutral"></div>
  <div id="root"></div>
  <script src="bundle.js"></script>
</body>
</html>`;
      fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    }

    // Ensure frontend/index.css — Glass-Brutalism fallback design system
    const cssPath = path.join(frontendDir, 'index.css');
    if (!fs.existsSync(cssPath)) {
      const defaultCss = `/* =============================================================
   KRNL Glass-Brutalism Fallback Design System
   Apple precision + glassmorphism depth + neo-brutalist structure
   Override any --krnl-* token in your own index.css to restyle.
   ============================================================= */

/* ── Google Fonts fallback ─────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ── Design Tokens ─────────────────────────────────────────── */
:root {
  /* Typography */
  --krnl-font: 'Inter', -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif;
  --krnl-font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;

  /* Page base — Pastel Matte Black */
  --krnl-bg: #16181d;
  --krnl-text: #f1f5f9;
  --krnl-text-muted: #8e95a5;

  /* Matte glass — panels, cards, containers (recede back) */
  --krnl-matte-bg: rgba(26, 29, 36, 0.75);
  --krnl-matte-bg-hover: rgba(34, 38, 48, 0.88);
  --krnl-matte-blur: blur(24px);

  /* Gloss — buttons, focused inputs (float forward) */
  --krnl-gloss-bg: linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%);
  --krnl-gloss-shine: inset 0 1px 0 rgba(255,255,255,0.20);

  /* Neo-brutalist borders & shadows */
  --krnl-border: 2px solid rgba(255, 255, 255, 0.85);
  --krnl-border-input: 2px solid rgba(255, 255, 255, 0.85);
  --krnl-radius: 14px;
  --krnl-radius-sm: 8px;
  --krnl-shadow: 5px 5px 0px rgba(0, 0, 0, 0.90);
  --krnl-shadow-hover: 8px 8px 0px rgba(0, 0, 0, 0.95);
  --krnl-shadow-btn: 4px 4px 0px rgba(0, 0, 0, 0.90);
  --krnl-shadow-btn-hover: 6px 6px 0px rgba(0, 0, 0, 0.95);
  --krnl-shadow-btn-active: 2px 2px 0px rgba(0, 0, 0, 0.90);

  /* Semantic accents — desaturated glow pastels for dark bg */
  --krnl-accent:      #2b4c7e; /* Dark powder blue */
  --krnl-accent-fg:   #f1f5f9;
  --krnl-success:     #1f4d36; /* Dark mint */
  --krnl-success-fg:  #f1f5f9;
  --krnl-danger:      #5c2424; /* Dark blush red */
  --krnl-danger-fg:   #f1f5f9;
  --krnl-warning:     #5e4e19; /* Dark butter yellow */
  --krnl-warning-fg:  #f1f5f9;

  /* Phantom / live-mode indicator */
  --krnl-phantom-glow: 0 0 24px rgba(48, 209, 88, 0.50);
  --krnl-phantom-border: 2px solid #30d158;
}

/* ── Reset ─────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--krnl-font);
  background-color: var(--krnl-bg);
  color: var(--krnl-text);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* ── Ambient Sphere Orbs (hidden for solid pastel black theme) ── */
.krnl-sphere { display: none; }

/* ── App Shell ─────────────────────────────────────────────── */
.krnl-app-shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  align-items: center;
}

/* ── Header (matte glass) ──────────────────────────────────── */
.krnl-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem 2rem;
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  -webkit-backdrop-filter: var(--krnl-matte-blur);
  border-bottom: var(--krnl-border);
  box-shadow: 0 3px 0px rgba(0, 0, 0, 0.90);
  letter-spacing: -0.02em;
  position: sticky;
  top: 0;
  z-index: 100;
}
.krnl-header h1 {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--krnl-text);
  text-align: center;
}

/* ── Nav Tabs (matte glass bar, wrapping + icon-only) ──────── */
.krnl-nav-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  -webkit-backdrop-filter: var(--krnl-matte-blur);
  border-bottom: var(--krnl-border);
}

/* Tab buttons — icon-only by default, reveal label on hover */
.krnl-tab-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  overflow: hidden;
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine);
  border: var(--krnl-border);
  color: var(--krnl-text);
  font-family: var(--krnl-font);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  /* Collapsed icon-only size */
  padding: 0.45rem 0.65rem;
  min-width: 2.4rem;
  max-width: 2.4rem;
  border-radius: var(--krnl-radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: box-shadow 0.15s ease, transform 0.15s ease, max-width 0.25s ease, padding 0.25s ease, gap 0.25s ease;
}

/* Tab button label — hidden until hover */
.krnl-tab-btn .krnl-tab-label {
  display: inline-block;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-width 0.25s ease, opacity 0.2s ease;
  white-space: nowrap;
  pointer-events: none;
}

/* Expand on hover */
.krnl-tab-btn:hover,
.krnl-tab-btn:focus-visible {
  max-width: 14rem;
  padding: 0.45rem 1rem;
  gap: 0.4rem;
  transform: translateY(-1px);
  box-shadow: var(--krnl-gloss-shine), 4px 4px 0px rgba(0, 0, 0, 0.95);
}
.krnl-tab-btn:hover .krnl-tab-label,
.krnl-tab-btn:focus-visible .krnl-tab-label {
  max-width: 10rem;
  opacity: 1;
}

/* Active tab — always show icon + label */
.krnl-tab-btn.active {
  background: var(--krnl-accent);
  color: var(--krnl-accent-fg);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn);
  transform: translateY(-1px);
  max-width: 14rem;
  padding: 0.45rem 1rem;
  gap: 0.4rem;
}
.krnl-tab-btn.active .krnl-tab-label {
  max-width: 10rem;
  opacity: 1;
}

/* ── Main Content Area ─────────────────────────────────────── */
.krnl-main-body {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  overflow-y: auto;
}

/* ── Endpoint Card (matte glass panel) ─────────────────────── */
.krnl-endpoint-card {
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  -webkit-backdrop-filter: var(--krnl-matte-blur);
  border: var(--krnl-border);
  border-radius: var(--krnl-radius);
  box-shadow: var(--krnl-shadow);
  padding: 1.75rem;
  min-width: 320px;
  max-width: 480px;
  width: 100%;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  position: relative;
  margin: 0 auto;
}
.krnl-endpoint-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--krnl-shadow-hover);
  background: var(--krnl-matte-bg-hover);
}
.krnl-endpoint-card.krnl-phantom-active {
  border: var(--krnl-phantom-border);
  box-shadow: var(--krnl-phantom-glow);
}

.krnl-endpoint-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--krnl-text-muted);
  margin-bottom: 1.25rem;
}

/* ── Form Atoms (centered, icon-first, hover-reveal text) ───── */
.krnl-form-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
  width: 100%;
}

.krnl-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--krnl-text-muted);
  text-align: center;
  opacity: 0;
  max-height: 0px;
  overflow: hidden;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, max-height 0.2s ease, transform 0.2s ease;
}

.krnl-form-group:hover .krnl-label,
.krnl-form-group:focus-within .krnl-label {
  opacity: 1;
  max-height: 30px;
  transform: translateY(0);
  margin-bottom: 0.2rem;
}

/* Inputs — gloss surface (floats above matte panel) */
.krnl-input,
.krnl-select,
.krnl-textarea {
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine);
  border: var(--krnl-border-input);
  border-radius: var(--krnl-radius-sm);
  color: var(--krnl-text);
  font-family: var(--krnl-font);
  font-size: 0.9rem;
  padding: 0.65rem 0.85rem;
  width: 100%;
  text-align: center;
  outline: none;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}
.krnl-input:focus,
.krnl-select:focus,
.krnl-textarea:focus {
  border-color: #1d1d1f;
  box-shadow: var(--krnl-gloss-shine), 0 0 0 3px rgba(200, 223, 245, 0.50);
}
.krnl-textarea { resize: vertical; min-height: 90px; text-align: left; }

.krnl-toggle-group {
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
}

/* ── Buttons (gloss, centered icon-first, hover-to-reveal text) ── */
.krnl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--krnl-font);
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  padding: 0.65rem 1rem;
  border-radius: var(--krnl-radius-sm);
  border: var(--krnl-border);
  cursor: pointer;
  user-select: none;
  margin: 0 auto;
  transition: box-shadow 0.15s ease, transform 0.15s ease, padding 0.2s ease;
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn);
  color: var(--krnl-text);
}

.krnl-btn-icon {
  font-size: 1.1rem;
  filter: grayscale(100%);
  display: inline-block;
  line-height: 1;
}

.krnl-btn-label {
  display: inline-block;
  max-width: 0px;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}

.krnl-btn:hover .krnl-btn-label,
.krnl-btn:focus .krnl-btn-label,
.krnl-btn:disabled .krnl-btn-label {
  max-width: 200px;
  opacity: 1;
  margin-left: 0.25rem;
}

.krnl-btn:hover .krnl-btn-icon {
  filter: grayscale(0%);
}

.krnl-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn-hover);
  padding: 0.65rem 1.35rem;
}
.krnl-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn-active);
}
.krnl-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Semantic button variants */
.krnl-btn-primary  { background: var(--krnl-accent);  color: var(--krnl-accent-fg); }
.krnl-btn-success  { background: var(--krnl-success); color: var(--krnl-success-fg); }
.krnl-btn-danger   { background: var(--krnl-danger);  color: var(--krnl-danger-fg); }
.krnl-btn-warning  { background: var(--krnl-warning); color: var(--krnl-warning-fg); }

/* ── JSON Viewer ───────────────────────────────────────────── */
.krnl-json-viewer {
  background: rgba(245, 245, 247, 0.30);
  backdrop-filter: blur(8px);
  border: var(--krnl-border);
  border-radius: var(--krnl-radius-sm);
  padding: 1rem;
  margin-top: 0.5rem;
}
.krnl-json-code {
  font-family: var(--krnl-font-mono);
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--krnl-text);
  max-height: 320px;
  overflow-y: auto;
}

/* ── Tile ──────────────────────────────────────────────────── */
.krnl-tile {
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  border: var(--krnl-border);
  border-radius: var(--krnl-radius);
  box-shadow: var(--krnl-shadow);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.krnl-tile-title  { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--krnl-text-muted); }
.krnl-tile-value  { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.04em; color: var(--krnl-text); }
.krnl-tile-subtitle { font-size: 0.75rem; color: var(--krnl-text-muted); }

/* ── Carousel ──────────────────────────────────────────────── */
.krnl-carousel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
}
.krnl-carousel-item {
  scroll-snap-align: start;
  flex: 0 0 220px;
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow);
  border: var(--krnl-border);
  border-radius: var(--krnl-radius-sm);
  padding: 1rem;
  font-size: 0.88rem;
}

/* ── Phantom Badge ─────────────────────────────────────────── */
.krnl-phantom-badge {
  position: absolute;
  top: -10px; right: -10px;
  background: #30d158;
  color: #fff;
  font-family: var(--krnl-font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  border: 2px solid #1d1d1f;
  box-shadow: 2px 2px 0px #1d1d1f;
}

/* ── JSON Builder Rows ─────────────────────────────────────── */
.krnl-json-rows { display: flex; flex-direction: column; gap: 0.5rem; }
.krnl-json-row  { display: flex; gap: 0.5rem; align-items: center; }
.krnl-json-key  { flex: 2; }
.krnl-json-type { flex: 1; }
.krnl-json-val  { flex: 3; }

/* ── Empty State ───────────────────────────────────────────── */
.krnl-empty {
  color: var(--krnl-text-muted);
  font-size: 0.88rem;
  text-align: center;
  padding: 2rem;
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 768px) {
  .krnl-header, .krnl-nav-tabs { padding-left: 1rem; padding-right: 1rem; }
  .krnl-main-body { padding: 1rem; }
  .krnl-endpoint-card { max-width: 100%; min-width: 0; }
  .krnl-sphere-accent { width: 320px; height: 320px; }
  .krnl-sphere-neutral { width: 260px; height: 260px; }
}
`;
      fs.writeFileSync(cssPath, defaultCss, 'utf-8');
    }
  }

  /**
   * Verifies React dependencies are installed in frontend/
   */
  static checkReactDependencies(frontendDir: string): void {
    const nodeModulesReact = path.join(frontendDir, 'node_modules', 'react');
    const rootNodeModulesReact = path.resolve(frontendDir, '../../node_modules/react');

    let hasReact = fs.existsSync(nodeModulesReact) || fs.existsSync(rootNodeModulesReact);
    if (!hasReact) {
      try {
        require.resolve('react', { paths: [frontendDir, process.cwd()] });
        hasReact = true;
      } catch (_) {}
    }

    if (!hasReact) {
      console.error(`
┌─────────────────────────────────────────────────────────────────────────┐
│ [KrnlFrontend] WARNING: UI components are enabled but React is missing! │
│ Please run inside your frontend/ directory:                             │
│   npm install react react-dom                                           │
│   npm install -D @types/react @types/react-dom                         │
└─────────────────────────────────────────────────────────────────────────┘
`);
    }
  }

  /**
   * Validates uiSpec definitions at build time to enforce protocol constraints and catch errors early
   */
  static validateUiSpec(fid: string, uiSpec: KrnlUiSpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const ALLOWED_INPUT_COMPONENTS = new Set([
      'KrnlTextInput',
      'KrnlNumberInput',
      'KrnlToggle',
      'KrnlDropdown',
      'KrnlTextArea',
      'KrnlJsonInput'
    ]);
    const ALLOWED_OUTPUT_COMPONENTS = new Set([
      'KrnlJsonViewer',
      'KrnlCarousel',
      'KrnlTile',
      'KrnlSSELog'
    ]);

    (uiSpec.inputs || []).forEach((spec) => {
      if (!spec.field || typeof spec.field !== 'string') {
        errors.push(`[ERR_UISPEC_MISSING_FIELD] Endpoint '${fid}' input is missing required 'field' name.`);
      }
      if (spec.component && !ALLOWED_INPUT_COMPONENTS.has(spec.component)) {
        errors.push(`[ERR_UISPEC_INVALID_INPUT_COMPONENT] Endpoint '${fid}' input '${spec.field}' uses invalid component '${spec.component}'. Allowed input components: ${Array.from(ALLOWED_INPUT_COMPONENTS).join(', ')}`);
      }
      if (spec.sharedComponentId && typeof spec.sharedComponentId !== 'string') {
        errors.push(`[ERR_UISPEC_INVALID_SLOT] Endpoint '${fid}' input '${spec.field}' sharedComponentId must be a string.`);
      }
      if (spec.sourceEndpointId && typeof spec.sourceEndpointId !== 'string') {
        errors.push(`[ERR_UISPEC_INVALID_SOURCE_ENDPOINT] Endpoint '${fid}' input '${spec.field}' sourceEndpointId must be a string.`);
      }
      // SELECTION-SOURCE PATTERN ENFORCEMENT 1: sourceEndpointId requires KrnlDropdown
      if (spec.sourceEndpointId && spec.component !== 'KrnlDropdown') {
        errors.push(`[ERR_UISPEC_SOURCE_ENDPOINT_REQUIRES_DROPDOWN] Endpoint '${fid}' input '${spec.field}' sets sourceEndpointId='${spec.sourceEndpointId}' but uses component '${spec.component}'. Selection-source fields MUST use component 'KrnlDropdown'.`);
      }
      // SELECTION-SOURCE PATTERN ENFORCEMENT 2: KrnlDropdown must be backed by a source
      if (spec.component === 'KrnlDropdown' && !spec.sharedComponentId && !spec.sourceEndpointId && (!spec.options || spec.options.length === 0)) {
        errors.push(`[ERR_UISPEC_DROPDOWN_MISSING_SOURCE] Endpoint '${fid}' input '${spec.field}' uses component 'KrnlDropdown' but provides no selection source. Must set 'sharedComponentId', 'sourceEndpointId', or static 'options'.`);
      }
      // SELECTION-SOURCE PATTERN ENFORCEMENT 3: Selection candidate fields must not use text inputs
      const SELECTION_FIELD_PATTERNS = ['provider', 'model', 'modelName', 'model_name', 'profile', 'key_id', 'keyId'];
      if (spec.component === 'KrnlTextInput' && SELECTION_FIELD_PATTERNS.includes(spec.field)) {
        console.warn(`\n┌─────────────────────────────────────────────────────────────────────────┐`);
        console.warn(`│ [KrnlUiSpecValidator] SELECTION-SOURCE PATTERN WARNING:                │`);
        console.warn(`│ Endpoint '${fid}' input '${spec.field}' uses KrnlTextInput.                │`);
        console.warn(`│ Field '${spec.field}' is a finite-choice selection candidate.            │`);
        console.warn(`│ KRNL ARCHITECTURE RULE: Users MUST NOT type finite selections manually.  │`);
        console.warn(`│ FIX: Change component to 'KrnlDropdown' and specify 'sharedComponentId' │`);
        console.warn(`│      or 'sourceEndpointId' pointing to the options-providing endpoint.  │`);
        console.warn(`└─────────────────────────────────────────────────────────────────────────┘\n`);
      }
      if (spec.bindMode && spec.bindMode !== 'selected' && spec.bindMode !== 'all') {
        errors.push(`[ERR_UISPEC_INVALID_BINDMODE] Endpoint '${fid}' input '${spec.field}' bindMode '${spec.bindMode}' is invalid. Allowed: 'selected' | 'all'`);
      }
      if (spec.autoFetch) {
        errors.push(`[ERR_UISPEC_INVALID_AUTOFETCH] Endpoint '${fid}' input '${spec.field}' cannot use autoFetch. autoFetch is only allowed on output provider components.`);
      }
    });

    (uiSpec.outputs || []).forEach((spec) => {
      if (!spec.field || typeof spec.field !== 'string') {
        errors.push(`[ERR_UISPEC_MISSING_FIELD] Endpoint '${fid}' output is missing required 'field' name.`);
      }
      if (spec.component && !ALLOWED_OUTPUT_COMPONENTS.has(spec.component)) {
        errors.push(`[ERR_UISPEC_INVALID_OUTPUT_COMPONENT] Endpoint '${fid}' output '${spec.field}' uses input component '${spec.component}'. Output fields must use display components: ${Array.from(ALLOWED_OUTPUT_COMPONENTS).join(', ')}.`);
      }
      if (spec.autoFetch && !spec.sharedComponentId) {
        errors.push(`[ERR_UISPEC_AUTOFETCH_MISSING_SLOT] Endpoint '${fid}' output '${spec.field}' sets autoFetch=true but lacks sharedComponentId.`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates that all UI components reference real registered endpoints on the entity.
   */
  static validateExecutionContract(entity: any, uiEndpoints: { id: string; uiSpec: KrnlUiSpec }[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const registeredFids = new Set<string>([
      ...(entity.localFunctionalities?.keys() || []),
      ...(entity.remoteFunctionalities?.keys() || [])
    ]);

    for (const ep of uiEndpoints) {
      if (!registeredFids.has(ep.id)) {
        errors.push(`[ERR_UI_DEAD_FETCH] UI component generated for endpoint '${ep.id}', but no handler is registered on entity '${entity.entityName}'.`);
      }
      for (const input of ep.uiSpec.inputs || []) {
        if (input.sourceEndpointId && !registeredFids.has(input.sourceEndpointId)) {
          errors.push(`[ERR_UI_STALE_ENDPOINT] Endpoint '${ep.id}' input '${input.field}' references sourceEndpointId '${input.sourceEndpointId}', which is not a registered endpoint.`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generates TS source code for a single endpoint UI component using VanJS
   */
  static generateComponentSource(fid: string, uiSpec: KrnlUiSpec, schema: any): string {
    const validation = this.validateUiSpec(fid, uiSpec);
    if (!validation.valid) {
      console.error(`
┌─────────────────────────────────────────────────────────────────────────┐
│ [KrnlUiSpecValidator] BUILD ERROR IN ENDPOINT '${fid}':
${validation.errors.map((e) => `│  - ${e}`).join('\n')}
└─────────────────────────────────────────────────────────────────────────┘
`);
      throw new Error(`[KrnlUiSpecValidationError] Invalid uiSpec in endpoint '${fid}': ${validation.errors.join('; ')}`);
    }

    let inputs = uiSpec.inputs || [];
    const outputs = uiSpec.outputs || [];

    if (inputs.length === 0 && schema && schema.input) {
      try {
        let shape: Record<string, any> = {};
        if (typeof schema.input._def?.shape === 'function') {
          shape = schema.input._def.shape();
        } else if (schema.input.shape) {
          shape = schema.input.shape;
        }
        inputs = Object.keys(shape).map((field) => ({
          field,
          label: field,
          component: 'KrnlTextInput',
          placeholder: `Enter ${field}`
        }));
      } catch (e) {
        console.warn(`[KrnlFrontendGenerator] Could not infer input fields for '${fid}':`, e);
      }
    }

    const sharedInputIds = inputs.filter((i) => i.sharedComponentId).map((i) => i.sharedComponentId!);
    const sharedOutputIds = outputs.filter((o) => o.sharedComponentId).map((o) => o.sharedComponentId!);
    const allSharedIds = Array.from(new Set([...sharedInputIds, ...sharedOutputIds]));

    const sourceEndpointInputs = inputs.filter((i) => i.sourceEndpointId);
    const autoFetchOutput = outputs.find((o) => o.autoFetch && o.sharedComponentId);

    return `import van from 'vanjs-core';
import { KrnlButton, KrnlTextInput, KrnlDropdown, KrnlTextArea, KrnlJsonViewer, KrnlTile, getSharedSlot, KrnlAgentBridge } from '../../atoms/index.js';

const { div, h3, h4, form } = van.tags;

export default function Endpoint_${fid.replace(/[^a-zA-Z0-9]/g, '_')}() {
  const formData = van.state<Record<string, any>>({});
  const response = van.state<any>(null);
  const loading = van.state(false);
  const error = van.state<string | null>(null);
  const phantomActive = van.state(false);

  ${allSharedIds
    .map(
      (id) =>
        `const slot_${id.replace(/[^a-zA-Z0-9]/g, '_')} = getSharedSlot('${id}');`
    )
    .join('\n  ')}

  KrnlAgentBridge.register('${fid}', {
    trigger: async (overrideInput?: Record<string, any>, ticketId?: string) => {
      return await executeRequest(overrideInput, ticketId);
    }
  });

  const handleInputChange = (field: string, val: any) => {
    formData.val = { ...formData.val, [field]: val };
    KrnlAgentBridge.setState('${fid}', {
      fid: '${fid}',
      formData: formData.val,
      response: response.val,
      loading: false,
      error: null,
      lastUpdated: Date.now()
    });
  };

  const executeRequest = async (overrideData?: Record<string, any>, ticketId?: string) => {
    loading.val = true;
    error.val = null;
    if (ticketId || overrideData) {
      phantomActive.val = true;
    }
    const activeInput = overrideData || formData.val;
    if (overrideData) formData.val = { ...formData.val, ...overrideData };

    try {
      const res = await fetch('/frontend/api/${fid}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeInput),
      });
      const data = await res.json();
      const payload = data.payload !== undefined ? data.payload : data;
      response.val = payload;

      if (payload && (payload.status === 'error' || payload.message)) {
        if (payload.status === 'error') error.val = payload.message || 'Request failed';
      }

      ${outputs
        .filter((o) => o.sharedComponentId)
        .map((o) => {
          const varName = `slot_${o.sharedComponentId!.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const fieldKey = o.field;
          const dataPath = o.dataPath;
          return `
      let extracted: any = null;
      if (payload && typeof payload === 'object') {
        ${dataPath ? `extracted = payload['${dataPath}'];` : `extracted = payload['${fieldKey}'] !== undefined ? payload['${fieldKey}'] : payload;`}
      }
      if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
        if (extracted.status === 'success' && extracted.data) extracted = extracted.data;
        else if (extracted.providers && Array.isArray(extracted.providers)) extracted = extracted.providers;
        else if (extracted.models && Array.isArray(extracted.models)) extracted = extracted.models;
        else if (extracted.agents && Array.isArray(extracted.agents)) extracted = extracted.agents;
        else if (extracted.keys && typeof extracted.keys === 'object') {
          extracted = Object.keys(extracted).map(k => ({ id: k, name: k, value: k }));
        }
      }
      if (Array.isArray(extracted)) {
        ${varName}.options.val = extracted;
      }`;
        })
        .join('\n      ')}

      if (ticketId) KrnlAgentBridge.sendJobComplete(ticketId, '${fid}', payload, undefined);
      return payload;
    } catch (err: any) {
      const errMsg = err.message || 'Request failed';
      error.val = errMsg;
      if (ticketId) KrnlAgentBridge.sendJobComplete(ticketId, '${fid}', null, errMsg);
    } finally {
      loading.val = false;
      if (ticketId || overrideData) {
        setTimeout(() => { phantomActive.val = false; }, 2000);
      }
    }
  };

  ${autoFetchOutput ? `executeRequest({});` : ''}
  ${sourceEndpointInputs
    .map(
      (i) => `
  fetch('/frontend/api/${i.sourceEndpointId}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    .then((r) => r.json())
    .then((d) => {
      const payload = d.payload !== undefined ? d.payload : d;
      let list = payload.${i.dataPath || i.field} || payload.data || payload.items || payload.providers || payload.models || payload.agents || payload;
      if (list && typeof list === 'object' && !Array.isArray(list)) list = Object.keys(list).map(k => ({ id: k, name: k, value: k }));
      if (Array.isArray(list) && ${i.sharedComponentId ? `slot_${i.sharedComponentId.replace(/[^a-zA-Z0-9]/g, '_')}` : 'null'}) {
        slot_${i.sharedComponentId!.replace(/[^a-zA-Z0-9]/g, '_')}.options.val = list;
      }
    })
    .catch(() => {});`
    )
    .join('\n  ')}

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await executeRequest();
  };

  return div(
    {
      className: () => \`krnl-endpoint-card \${phantomActive.val ? 'krnl-phantom-active' : ''}\`,
      style: () => \`
        background: var(--krnl-bg-surface);
        padding: 1.5rem;
        border-radius: 12px;
        border: \${phantomActive.val ? '2px solid var(--krnl-accent)' : '1px solid var(--krnl-border-color)'};
        transition: all 0.3s ease;
        position: relative;
      \`
    },
    () => (phantomActive.val ? div({ className: 'krnl-phantom-badge' }, '🤖 Phantom Execution Active') : null),
    h3({ style: 'margin-bottom: 1rem; color: var(--krnl-primary);' }, 'Endpoint: ${fid}'),
    form(
      { onsubmit: handleSubmit },
      ${inputs.map((inSpec) => this.renderVanInputAtom(inSpec)).join(',\n      ')}${inputs.length > 0 ? ',' : ''}
      KrnlButton({ type: 'submit', loading, disabled: loading, label: 'Execute ${fid}', icon: '⚡' })
    ),
    () => (error.val ? div({ style: 'color: var(--krnl-danger); margin-top: 1rem;' }, 'Error: ', error.val) : null),
    () =>
      response.val !== null
        ? div(
            { style: 'margin-top: 1.5rem; border-top: 1px solid var(--krnl-border-color); padding-top: 1rem;' },
            h4({ style: 'margin-bottom: 0.5rem; color: var(--krnl-accent);' }, 'Output Response'),
            ${outputs.length > 0
              ? outputs.map((outSpec) => this.renderVanOutputAtom(outSpec)).join(',\n            ')
              : `KrnlJsonViewer({ data: response })`
            }
          )
        : null
  );
}
`;
  }

  private static renderVanInputAtom(spec: KrnlUiFieldSpec): string {
    const label = spec.label || spec.field;
    if (spec.sharedComponentId) {
      const varName = `slot_${spec.sharedComponentId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const bindMode = spec.bindMode || 'selected';
      return `KrnlDropdown({
        label: "${label}",
        value: van.derive(() => formData.val['${spec.field}'] !== undefined ? formData.val['${spec.field}'] : (${varName}.value.val || '')),
        options: ${varName}.options,
        onChange: (v) => {
          ${varName}.value.val = v;
          handleInputChange('${spec.field}', ${bindMode === 'all' ? `${varName}.options.val` : 'v'});
        }
      })`;
    }

    switch (spec.component) {
      case 'KrnlTextInput':
        return `KrnlTextInput({ label: "${label}", value: van.derive(() => formData.val['${spec.field}'] || ''), onChange: (v) => handleInputChange('${spec.field}', v), placeholder: "${spec.placeholder || ''}" })`;
      case 'KrnlTextArea':
        return `KrnlTextArea({ label: "${label}", value: van.derive(() => formData.val['${spec.field}'] || ''), onChange: (v) => handleInputChange('${spec.field}', v), placeholder: "${spec.placeholder || ''}" })`;
      case 'KrnlDropdown':
        const opts = JSON.stringify(spec.options || []);
        return `KrnlDropdown({ label: "${label}", value: van.derive(() => formData.val['${spec.field}'] || ''), options: ${opts}, onChange: (v) => handleInputChange('${spec.field}', v) })`;
      default:
        return `KrnlTextInput({ label: "${label}", value: van.derive(() => formData.val['${spec.field}'] || ''), onChange: (v) => handleInputChange('${spec.field}', v) })`;
    }
  }

  private static renderVanOutputAtom(spec: KrnlUiFieldSpec): string {
    const label = spec.label || spec.field;
    if (spec.sharedComponentId) {
      const varName = `slot_${spec.sharedComponentId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      return `KrnlJsonViewer({ label: "${label}", data: ${varName}.options })`;
    }

    switch (spec.component) {
      case 'KrnlTile':
        return `KrnlTile({ label: "${label}", value: van.derive(() => response.val ? (response.val['${spec.field}'] !== undefined ? response.val['${spec.field}'] : response.val) : '') })`;
      default:
        return `KrnlJsonViewer({ label: "${label}", data: van.derive(() => response.val ? (response.val['${spec.field}'] !== undefined ? response.val['${spec.field}'] : response.val) : response.val) })`;
    }
  }

  /**
   * Generates root index.ts aggregator using VanJS
   */
  static generateIndexSource(
    appName: string,
    uiEndpoints: { id: string }[],
    subAppPrefixes: string[]
  ): string {
    const imports = uiEndpoints
      .map(
        (ep) =>
          `import Endpoint_${ep.id.replace(/[^a-zA-Z0-9]/g, '_')} from './components/${ep.id}/index.js';`
      )
      .join('\n');

    const initialTab = uiEndpoints.length > 0 ? uiEndpoints[0].id : (subAppPrefixes.length > 0 ? subAppPrefixes[0] : 'welcome');

    return `import van from 'vanjs-core';
${imports}

const { div, header, span, h1, button, main, iframe, h2, p } = van.tags;

function AppShell() {
  const activeTab = van.state<string>('${initialTab}');

  return div(
    { className: 'krnl-app-shell' },
    header(
      { className: 'krnl-header' },
      div(
        { style: 'display: flex; align-items: center; gap: 0.65rem;' },
        span({ style: 'font-size: 1.2rem; line-height: 1;' }, '⬡'),
        h1('${appName}')
      )
    ),
    div(
      { className: 'krnl-nav-tabs' },
      ${uiEndpoints
        .map(
          (ep) =>
            `button({ className: () => \`krnl-tab-btn \${activeTab.val === '${ep.id}' ? 'active' : ''}\`, onclick: () => activeTab.val = '${ep.id}', title: '${ep.id}' }, span('⬡'), span({ className: 'krnl-tab-label' }, '${ep.id}'))`
        )
        .join(',\n      ')}${uiEndpoints.length > 0 && subAppPrefixes.length > 0 ? ',' : ''}
      ${subAppPrefixes
        .map(
          (sub) =>
            `button({ className: () => \`krnl-tab-btn \${activeTab.val === '${sub}' ? 'active' : ''}\`, onclick: () => activeTab.val = '${sub}', title: '${sub}' }, span('📦'), span({ className: 'krnl-tab-label' }, '${sub}'))`
        )
        .join(',\n      ')}
    ),
    main(
      { className: 'krnl-main-body' },
      ${uiEndpoints
        .map(
          (ep) =>
            `div({ style: () => \`display: \${activeTab.val === '${ep.id}' ? 'block' : 'none'}\` }, Endpoint_${ep.id.replace(/[^a-zA-Z0-9]/g, '_')}())`
        )
        .join(',\n      ')}${uiEndpoints.length > 0 && subAppPrefixes.length > 0 ? ',' : ''}
      ${subAppPrefixes
        .map(
          (sub) =>
            `() => activeTab.val === '${sub}' ? iframe({ src: '/${sub}/frontend/', title: '${sub}', style: 'width: 100%; height: calc(100vh - 160px); border: none; border-radius: 8px;' }) : null`
        )
        .join(',\n      ')}
    )
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  van.add(rootElement, AppShell());
}
`;
  }

  static generateAtoms(frontendDir: string) {
    const atomsDir = path.join(frontendDir, 'src', 'atoms');
    fs.mkdirSync(atomsDir, { recursive: true });
  }
}

