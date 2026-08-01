import {
  __esm,
  __export
} from "./chunk-PNKVD2UK.js";

// src/krnl/core/K_LIB_Krnl_Frontend_Generator.ts
var K_LIB_Krnl_Frontend_Generator_exports = {};
__export(K_LIB_Krnl_Frontend_Generator_exports, {
  KrnlFrontendGenerator: () => KrnlFrontendGenerator
});
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var _metaUrl, _filename, _dirname, KrnlFrontendGenerator;
var init_K_LIB_Krnl_Frontend_Generator = __esm({
  "src/krnl/core/K_LIB_Krnl_Frontend_Generator.ts"() {
    _metaUrl = typeof import.meta !== "undefined" && import.meta.url ? import.meta.url : null;
    _filename = _metaUrl ? fileURLToPath(_metaUrl) : "";
    _dirname = _metaUrl ? path.dirname(_filename) : "";
    KrnlFrontendGenerator = class {
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
        this.generateAtoms(frontendDir);
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
        const candidates = [
          path.resolve(_dirname, "../src/krnl/frontend/atoms"),
          path.resolve(_dirname, "../../src/krnl/frontend/atoms"),
          path.resolve(_dirname, "../frontend/atoms"),
          path.resolve(process.cwd(), "node_modules/krnlts/src/krnl/frontend/atoms"),
          path.resolve(process.cwd(), "node_modules/krnlts/dist/frontend/atoms")
        ];
        const libAtomsDir = candidates.find((c) => fs.existsSync(c));
        if (libAtomsDir && fs.existsSync(libAtomsDir)) {
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
          fs.writeFileSync(htmlPath, htmlContent, "utf-8");
        }
        const cssPath = path.join(frontendDir, "index.css");
        if (!fs.existsSync(cssPath)) {
          const defaultCss = `/* =============================================================
   KRNL Glass-Brutalism Fallback Design System
   Apple precision + glassmorphism depth + neo-brutalist structure
   Override any --krnl-* token in your own index.css to restyle.
   ============================================================= */

/* \u2500\u2500 Google Fonts fallback \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* \u2500\u2500 Design Tokens \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
:root {
  /* Typography */
  --krnl-font: 'Inter', -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif;
  --krnl-font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;

  /* Page base \u2014 Pastel Matte Black */
  --krnl-bg: #16181d;
  --krnl-text: #f1f5f9;
  --krnl-text-muted: #8e95a5;

  /* Matte glass \u2014 panels, cards, containers (recede back) */
  --krnl-matte-bg: rgba(26, 29, 36, 0.75);
  --krnl-matte-bg-hover: rgba(34, 38, 48, 0.88);
  --krnl-matte-blur: blur(24px);

  /* Gloss \u2014 buttons, focused inputs (float forward) */
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

  /* Semantic accents \u2014 desaturated glow pastels for dark bg */
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

/* \u2500\u2500 Reset \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--krnl-font);
  background-color: var(--krnl-bg);
  color: var(--krnl-text);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* \u2500\u2500 Ambient Sphere Orbs (hidden for solid pastel black theme) \u2500\u2500 */
.krnl-sphere { display: none; }

/* \u2500\u2500 App Shell \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-app-shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  align-items: center;
}

/* \u2500\u2500 Header (matte glass) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Nav Tabs (matte glass bar) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-nav-tabs {
  display: flex;
  justify-content: center;
  width: 100%;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  -webkit-backdrop-filter: var(--krnl-matte-blur);
  border-bottom: var(--krnl-border);
  overflow-x: auto;
  scrollbar-width: none;
}
.krnl-nav-tabs::-webkit-scrollbar { display: none; }

.krnl-tab-btn {
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine);
  border: var(--krnl-border);
  color: var(--krnl-text);
  font-family: var(--krnl-font);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  padding: 0.45rem 1rem;
  border-radius: var(--krnl-radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: box-shadow 0.12s ease, transform 0.12s ease;
}
.krnl-tab-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--krnl-gloss-shine), 4px 4px 0px rgba(0, 0, 0, 0.95);
}
.krnl-tab-btn.active {
  background: var(--krnl-accent);
  color: var(--krnl-accent-fg);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn);
  transform: translateY(-1px);
}

/* \u2500\u2500 Main Content Area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Endpoint Card (matte glass panel) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Form Atoms (centered, icon-first, hover-reveal text) \u2500\u2500\u2500\u2500\u2500 */
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

/* Inputs \u2014 gloss surface (floats above matte panel) */
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

/* \u2500\u2500 Buttons (gloss, centered icon-first, hover-to-reveal text) \u2500\u2500 */
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
.krnl-btn:focus .krnl-btn-label {
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

/* \u2500\u2500 JSON Viewer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Tile \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Carousel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Phantom Badge \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 JSON Builder Rows \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-json-rows { display: flex; flex-direction: column; gap: 0.5rem; }
.krnl-json-row  { display: flex; gap: 0.5rem; align-items: center; }
.krnl-json-key  { flex: 2; }
.krnl-json-type { flex: 1; }
.krnl-json-val  { flex: 3; }

/* \u2500\u2500 Empty State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-empty {
  color: var(--krnl-text-muted);
  font-size: 0.88rem;
  text-align: center;
  padding: 2rem;
}

/* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (max-width: 768px) {
  .krnl-header, .krnl-nav-tabs { padding-left: 1rem; padding-right: 1rem; }
  .krnl-main-body { padding: 1rem; }
  .krnl-endpoint-card { max-width: 100%; min-width: 0; }
  .krnl-sphere-accent { width: 320px; height: 320px; }
  .krnl-sphere-neutral { width: 260px; height: 260px; }
}
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
        const sharedInputIds = inputs.filter((i) => i.sharedComponentId).map((i) => i.sharedComponentId);
        const sharedOutputIds = outputs.filter((o) => o.sharedComponentId).map((o) => o.sharedComponentId);
        const allSharedIds = Array.from(/* @__PURE__ */ new Set([...sharedInputIds, ...sharedOutputIds]));
        if (allSharedIds.length > 0) {
          atomImports.add("useSharedSlot");
        }
        const importStatement = `import { ${Array.from(atomImports).join(", ")} } from '../../atoms/index.js';`;
        const autoFetchOutput = outputs.find((o) => o.autoFetch && o.sharedComponentId);
        return `import React, { useState, useEffect } from 'react';
${importStatement}

export default function Endpoint_${fid.replace(/[^a-zA-Z0-9]/g, "_")}() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phantomActive, setPhantomActive] = useState(false);

  ${allSharedIds.map(
          (id) => `const slot_${id.replace(/[^a-zA-Z0-9]/g, "_")} = useSharedSlot('${id}');`
        ).join("\n  ")}

  // Subscribe to live SSE events for phantom mirroring
  useEffect(() => {
    const sse = new EventSource('/sse/${fid}');
    sse.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'frontend:interaction' || msg.input !== undefined) {
          if (msg.input) setFormData((prev) => ({ ...prev, ...msg.input }));
          if (msg.output !== undefined) {
            const payload = msg.output?.payload !== undefined ? msg.output.payload : msg.output;
            setResponse(payload);
          }
          setPhantomActive(true);
          setTimeout(() => setPhantomActive(false), 2000);
        }
      } catch (e) {}
    };
    return () => sse.close();
  }, []);

  ${autoFetchOutput ? `// Auto-fetch output on mount
  useEffect(() => {
    executeRequest({});
  }, []);` : ""}

  // Populate output shared components when response arrives
  useEffect(() => {
    if (response === null) return;
    ${outputs.filter((o) => o.sharedComponentId).map((o) => {
          const varName = `slot_${o.sharedComponentId.replace(/[^a-zA-Z0-9]/g, "_")}`;
          const pathExpr = o.dataPath ? `(response && typeof response === 'object' ? response['${o.dataPath}'] : response)` : `(response && response['${o.field}'] !== undefined ? response['${o.field}'] : response)`;
          return `if (${pathExpr} !== undefined && Array.isArray(${pathExpr})) {
      ${varName}.setOptions(${pathExpr});
    }`;
        }).join("\n    ")}
  }, [response]);

  const handleInputChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const executeRequest = async (overrideData?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const payloadData = overrideData || formData;
      const res = await fetch('api/${fid}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData),
      });
      const data = await res.json();
      const payload = data.payload !== undefined ? data.payload : data;
      setResponse(payload);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeRequest();
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
        <KrnlButton type="submit" disabled={loading} label={loading ? 'Executing...' : 'Execute ${fid}'} icon="\u26A1" />
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
        if (spec.sharedComponentId) {
          const varName = `slot_${spec.sharedComponentId.replace(/[^a-zA-Z0-9]/g, "_")}`;
          const bindMode = spec.bindMode || "selected";
          switch (spec.component) {
            case "KrnlDropdown":
              return `<KrnlDropdown label="${label}" value={formData['${spec.field}'] !== undefined ? formData['${spec.field}'] : (${varName}.value || '')} options={${varName}.options} onChange={(v) => { ${varName}.setValue(v); handleInputChange('${spec.field}', ${bindMode === "all" ? `${varName}.options` : "v"}); }} />`;
            case "KrnlCarousel":
              return `<KrnlCarousel label="${label}" items={${varName}.options} renderItem={(item: any) => (
            <div style={{ padding: '0.5rem', cursor: 'pointer', border: ${varName}.value === item ? '2px solid var(--krnl-primary)' : '1px solid var(--krnl-border-color)', borderRadius: '6px' }} onClick={() => { ${varName}.setValue(item); handleInputChange('${spec.field}', ${bindMode === "all" ? `${varName}.options` : "item"}); }}>
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </div>
          )} />`;
            default:
              return `<KrnlDropdown label="${label}" value={formData['${spec.field}'] !== undefined ? formData['${spec.field}'] : (${varName}.value || '')} options={${varName}.options} onChange={(v) => { ${varName}.setValue(v); handleInputChange('${spec.field}', ${bindMode === "all" ? `${varName}.options` : "v"}); }} />`;
          }
        }
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
        if (spec.sharedComponentId) {
          const varName = `slot_${spec.sharedComponentId.replace(/[^a-zA-Z0-9]/g, "_")}`;
          switch (spec.component) {
            case "KrnlDropdown":
              return `<KrnlDropdown label="${label}" value={${varName}.value || ''} options={${varName}.options} onChange={(v) => ${varName}.setValue(v)} />`;
            case "KrnlCarousel":
              return `<KrnlCarousel label="${label}" items={${varName}.options} renderItem={(item: any) => (
            <div style={{ padding: '0.5rem', cursor: 'pointer', border: ${varName}.value === item ? '2px solid var(--krnl-primary)' : '1px solid var(--krnl-border-color)', borderRadius: '6px' }} onClick={() => ${varName}.setValue(item)}>
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </div>
          )} />`;
            default:
              return `<KrnlJsonViewer label="${label}" data={${varName}.options} />`;
          }
        }
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
import { SharedComponentProvider } from './atoms/index.js';
${imports}

function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('${uiEndpoints.length > 0 ? uiEndpoints[0].id : subAppPrefixes.length > 0 ? subAppPrefixes[0] : "welcome"}');

  return (
    <SharedComponentProvider>
      <div className="krnl-app-shell">
        <header className="krnl-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>\u2B21</span>
            <h1>${appName}</h1>
          </div>
        </header>

        <div className="krnl-nav-tabs">
          ${uiEndpoints.map(
          (ep) => `<button className={\`krnl-tab-btn \${activeTab === '${ep.id}' ? 'active' : ''}\`} onClick={() => setActiveTab('${ep.id}')}>${ep.id}</button>`
        ).join("\n          ")}
          ${subAppPrefixes.map(
          (sub) => `<button className={\`krnl-tab-btn \${activeTab === '${sub}' ? 'active' : ''}\`} onClick={() => setActiveTab('${sub}')}>\u{1F4E6} ${sub}</button>`
        ).join("\n          ")}
        </div>

        <main className="krnl-main-body">
          ${uiEndpoints.map(
          (ep) => `{activeTab === '${ep.id}' && <Endpoint_${ep.id.replace(/[^a-zA-Z0-9]/g, "_")} />}`
        ).join("\n          ")}
          ${subAppPrefixes.map(
          (sub) => `{activeTab === '${sub}' && (
            <iframe
              src="/frontend/subapps/${sub}/"
              title="${sub}"
              style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none', borderRadius: '8px' }}
            />
          )}`
        ).join("\n          ")}
          ${uiEndpoints.length === 0 && subAppPrefixes.length === 0 ? `<div style={{ textAlign: 'center', color: 'var(--krnl-text-muted)', paddingTop: '4rem' }}>
            <h2>Welcome to ${appName}</h2>
            <p style={{ marginTop: '0.5rem' }}>No UI-enabled endpoints or sub-apps registered yet.</p>
          </div>` : ""}
        </main>
      </div>
    </SharedComponentProvider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<AppShell />);
}
`;
      }
      static generateAtoms(frontendDir) {
        const atomsDir = path.join(frontendDir, "src", "atoms");
        fs.mkdirSync(atomsDir, { recursive: true });
        fs.writeFileSync(
          path.join(atomsDir, "KrnlButton.tsx"),
          `import React from 'react';
export function KrnlButton({ label, onClick, disabled, loading, variant = 'primary', icon = '\u26A1', type, children }: any) {
  const textLabel = label || (typeof children === 'string' ? children : undefined) || 'Action';
  return (
    <button
      type={type || 'button'}
      className={\`krnl-btn krnl-btn-\${variant}\`}
      onClick={onClick}
      disabled={disabled || loading}
      title={typeof textLabel === 'string' ? textLabel : undefined}
    >
      <span className="krnl-btn-icon">{icon}</span>
      <span className="krnl-btn-label">{loading ? 'Processing...' : (children || textLabel)}</span>
    </button>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlTextInput.tsx"),
          `import React from 'react';
export function KrnlTextInput({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <input
        type={type}
        className="krnl-input"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlTextArea.tsx"),
          `import React from 'react';
export function KrnlTextArea({ label, value, onChange, placeholder, rows = 4 }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <textarea
        className="krnl-input krnl-textarea"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlTile.tsx"),
          `import React from 'react';
export function KrnlTile({ title, value }: any) {
  return (
    <div className="krnl-tile">
      {title && <div className="krnl-tile-title">{title}</div>}
      <div className="krnl-tile-value">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlJsonViewer.tsx"),
          `import React from 'react';
export function KrnlJsonViewer({ data, label }: any) {
  return (
    <div className="krnl-json-viewer">
      {label && <div className="krnl-label">{label}</div>}
      <pre className="krnl-json-code">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlCarousel.tsx"),
          `import React from 'react';
export function KrnlCarousel({ items, renderItem }: any) {
  if (!items || !items.length) return <div className="krnl-empty">No items available</div>;
  return (
    <div className="krnl-carousel">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="krnl-carousel-item">
          {renderItem ? renderItem(item) : JSON.stringify(item)}
        </div>
      ))}
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlNumberInput.tsx"),
          `import React from 'react';
export function KrnlNumberInput({ label, value, onChange, placeholder }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <input
        type="number"
        className="krnl-input"
        value={value ?? ''}
        onChange={(e) => onChange && onChange(Number(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlToggle.tsx"),
          `import React from 'react';
export function KrnlToggle({ label, value, onChange }: any) {
  return (
    <div className="krnl-form-group krnl-toggle-group">
      {label && <label className="krnl-label">{label}</label>}
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange && onChange(e.target.checked)}
      />
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlDropdown.tsx"),
          `import React from 'react';
export function KrnlDropdown({ label, value, options = [], onChange }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <select className="krnl-input" value={value || ''} onChange={(e) => onChange && onChange(e.target.value)}>
        <option value="">Select option...</option>
        {options.map((opt: any, idx: number) => (
          <option key={idx} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlJsonInput.tsx"),
          `import React from 'react';
export function KrnlJsonInput({ label, onChange }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <textarea
        className="krnl-input krnl-textarea"
        placeholder="{}"
        onChange={(e) => {
          try { onChange && onChange(JSON.parse(e.target.value)); } catch (err) {}
        }}
      />
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlSSELog.tsx"),
          `import React from 'react';
export function KrnlSSELog({ label }: any) {
  return (
    <div className="krnl-sse-log">
      {label && <div className="krnl-label">{label}</div>}
    </div>
  );
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "KrnlSharedState.tsx"),
          `import React, { createContext, useContext, useState } from 'react';

export interface SharedSlot {
  options: any[];
  value: any;
}

export const SharedComponentContext = createContext<Map<string, SharedSlot>>(new Map());
export const SharedComponentSetContext = createContext<(id: string, patch: Partial<SharedSlot>) => void>(() => {});

export function SharedComponentProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Map<string, SharedSlot>>(new Map());

  const update = (id: string, patch: Partial<SharedSlot>) => {
    setStore((prev) => {
      const m = new Map(prev);
      const existing = m.get(id) || { options: [], value: null };
      m.set(id, { ...existing, ...patch });
      return m;
    });
  };

  return (
    <SharedComponentContext.Provider value={store}>
      <SharedComponentSetContext.Provider value={update}>
        {children}
      </SharedComponentSetContext.Provider>
    </SharedComponentContext.Provider>
  );
}

export function useSharedSlot(id?: string) {
  const store = useContext(SharedComponentContext);
  const update = useContext(SharedComponentSetContext);

  if (!id) {
    return {
      options: [],
      value: null,
      setOptions: () => {},
      setValue: () => {},
    };
  }

  const slot = store.get(id) || { options: [], value: null };

  return {
    options: slot.options,
    value: slot.value,
    setOptions: (opts: any[]) => update(id, { options: opts }),
    setValue: (v: any) => update(id, { value: v }),
  };
}`,
          "utf-8"
        );
        fs.writeFileSync(
          path.join(atomsDir, "index.ts"),
          `export * from './KrnlButton.js';
export * from './KrnlTextInput.js';
export * from './KrnlNumberInput.js';
export * from './KrnlToggle.js';
export * from './KrnlDropdown.js';
export * from './KrnlTextArea.js';
export * from './KrnlJsonInput.js';
export * from './KrnlJsonViewer.js';
export * from './KrnlCarousel.js';
export * from './KrnlTile.js';
export * from './KrnlSSELog.js';
export * from './KrnlSharedState.js';
export * from './KrnlButton';
export * from './KrnlTextInput';
export * from './KrnlNumberInput';
export * from './KrnlToggle';
export * from './KrnlDropdown';
export * from './KrnlTextArea';
export * from './KrnlJsonInput';
export * from './KrnlJsonViewer';
export * from './KrnlCarousel';
export * from './KrnlTile';
export * from './KrnlSSELog';
export * from './KrnlSharedState';
`,
          "utf-8"
        );
      }
    };
  }
});

export {
  KrnlFrontendGenerator,
  K_LIB_Krnl_Frontend_Generator_exports,
  init_K_LIB_Krnl_Frontend_Generator
};
