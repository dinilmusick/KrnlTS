# TASK: THEME_SYSTEM_AND_THEME_BROWSER_PROTOCOL

$$\text{Valid}(\mathcal{T}) \iff \text{LegacyPurged}(\mathcal{T}) \wedge \text{SocketConformant}(\mathcal{T}) \wedge \text{BucketPacks}(\mathcal{T}) \wedge \text{BrowserActive}(\mathcal{T}) \wedge \text{TokenPurity}_{\text{var(--skipo-*)}}(\mathcal{T})$$
$$\text{LAWS}: \mathbf{L_1}, \mathbf{L_2}, \mathbf{L_4}, \mathbf{L_7}, \mathbf{L_9}, \mathbf{L_{12}}, \mathbf{L_{14}}, \mathbf{L_{18}}, \mathbf{L_{19}}, \mathbf{L_{20}}, \mathbf{L_{21}} \in \text{AGENTS.md}$$

> **EXCLUSIVE SCOPE**: This prompt owns **the complete eradication of legacy/ad-hoc theming and styling systems, and the total replacement with Skipo's canonical Theme Socket, System Bucket Theme Pack streaming/hydration, ThemeEngine runtime, and the interactive Theme Pack Browser & Element Override Inspector**.
>
> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY THEME PURGE ($\mathbf{L_{21}}$)**:
> Any legacy theming system (ad-hoc hex palettes, color pickers, custom theme builders, non-canonical CSS vars, or local storage theme caches) MUST BE ENTIRELY PURGED with ZERO TRACE left behind. No commented-out code, no dual-running theme providers.

---

## 0. INVIOLABLE STRUCTURAL INVARIANTS (THEME GOVERNANCE)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             SYSTEM BUCKET (S3 / R2 / B2)                         │
│   themes/<pack-id>/manifest.json | tokens.json | typography.json | elements.json │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │ Stream / Fetch / Cache
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 APP THEME SOCKET                                 │
│   appId: 'my-app'  |  elementIds: ['canvas', 'topToolbar', 'card', ...]         │
│   Central Ledger Registry (CANONICAL_ELEMENTS) ── validates ──► 0 Unregistered   │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │ Ingest & Resolve Cascade
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  THEME ENGINE                                    │
│   Base Pack + Active Mode (dark/light) + Selective Element-Level Overrides       │
│   ──► Computes Effective CSS Variables ──► Hydrates :root DOM                    │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │ Exposes State & Subscriptions
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   THEME PACK BROWSER & OVERRIDE INSPECTOR UI                     │
│   - Visual Theme Pack Gallery (Base Pack Switcher)                               │
│   - Granular Per-Element Theme Pack Overrides Dropdowns                          │
│   - Real-time Status Inspector (Active, Overrides Count, Uncovered, Ignored)      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Invariant 1: Total Purge of Ad-Hoc Theming
- **STRICTLY FORBIDDEN & PURGED**:
  - Ad-hoc custom color hex pickers (`#hex`, `rgb()`, `hsl()`) in user settings.
  - Hardcoded color constants (e.g. `DEFAULT_THEME_PRESETS = [{ accent: '#D4AF37' }]`).
  - Local ad-hoc color state stored in `localStorage` without ThemeEngine integration.
  - Scattered manual `.style.setProperty()` or inline styles that bypass the Theme Engine.
  - Non-standard CSS variables (e.g. `--color-custom-xyz`) not registered in the canonical UI element ledger or tokens schema.

### Invariant 2: The Global System Bucket Repository
- Themes are first-class versioned assets stored centrally in the **System Bucket** (`themes/<pack-id>/`):
  - `manifest.json`: Metadata (`id`, `name`, `version`, `mode`, `author`, `description`, `capabilities`).
  - `tokens.json`: Standardized semantic tokens (`font`, `bg`, `accent`, `border`, `shadow`, `status`, `shell`).
  - `typography.json`: Scale, font families, line heights, letter spacings, weights.
  - `elements.json`: Per-element CSS variable definitions, styles, effects, and asset bindings.
- Apps consume theme packs dynamically via the Theme Pack API routes (`/api/themes`) or bundled companion packs.

### Invariant 3: App Theme Socket Contract
- Every application MUST define a typed **App Theme Socket** declaring:
  1. `appId`: Unique string ID of the app (e.g. `'skipo'`, `'docustack'`).
  2. `appName`: Human-readable app name.
  3. `version`: Socket schema version.
  4. `elementIds`: Strict list of canonical UI elements consumed by the app.
  5. `defaultThemePackId`: Fallback theme pack ID.
  6. `elementDefaults`: Safe fallback styles if an element is omitted by an applied pack.
- **Ledger Rule**: Every `elementId` in the socket MUST exist in the central element ledger (`CANONICAL_ELEMENTS`). Unknown elements will halt the socket constructor.

### Invariant 4: Dual-Variant Architecture & Element Overrides
- Every theme pack provides dark and light variants.
- The **ThemeEngine** resolves visual parameters in a 4-tier hierarchy:
  $$\text{ResolvedStyle}(el) = \text{OverridePack}(el) \succ \text{BasePack}(el) \succ \text{BaseModeDefault}(el) \succ \text{SocketDefault}(el)$$
- Any canonical UI element (e.g. `buttonPrimary`, `kanbanColumn`, `graphNodeRoot`, `card`) can be overridden with a completely different theme pack independently of the base pack.

### Invariant 5: Code Limits & Standards
- Maximum 200 lines per file ($\le 200\text{L}$).
- 100% `@skipo/ui` primitives or atomic components.
- Zero raw `<button>`, `<input>`, or unthemed containers.
- Monochromatic vector icons (`lucide-react`) with max 4-word labels ($\mathbf{L_{18}}$).

---

## 1. THE 5-PHASE MIGRATION & IMPLEMENTATION PLAYBOOK

### Phase 1: Audit & Purge Legacy Theming
1. Scan for legacy theming files:
   - Search for `CustomThemeConfig`, `DEFAULT_THEME_PRESETS`, `UI_ELEMENT_COLOR_FIELDS`, or ad-hoc color pickers.
   - Search for components manipulating custom theme states manually.
2. Remove legacy color-picker controls, hardcoded hex lists, and custom theme builders from Settings/Appearance panels.
3. Keep only the standard Dark/Light mode toggle and replace custom builders with the **Theme Pack Browser**.

### Phase 2: App Theme Socket Setup & Ledger Registration
1. Verify or create `lib/theme-socket.ts` (or `src/libraries/theme/socket.ts`):
   - Declare all app UI elements in `elementIds`.
   - Ensure all elements are registered with the central element ledger:
     ```typescript
     // ══════════════════════════════════════════════════════════════════════════════════════
     // APP THEME SOCKET CONFIGURATION
     // ══════════════════════════════════════════════════════════════════════════════════════
     import { createAppThemeSocket, centralLedger } from '@skipo/ui';
     // or from local theme libraries
     ```
2. Define fallback `elementDefaults` with `var(--skipo-*)` tokens and semantic hex fallbacks.

### Phase 3: ThemeEngine Instantiation & Provider
1. Verify or instantiate the singleton `ThemeEngine`:
   ```typescript
   export const appThemeEngine = new ThemeEngine(appThemeSocket, AVAILABLE_THEME_PACKS, 'dark');
   ```
2. Wrap the application root in `<SkipoThemeProvider engine={appThemeEngine}>`.
3. Ensure DOM sync: `engine.applyToDOM()` attaches `--skipo-*` variables and `data-skipo-theme-id` to `document.documentElement`.

### Phase 4: Theme Pack API & System Bucket Seeding
1. Implement or verify `/api/themes/route.ts`:
   - `GET`: Returns available theme packs, socket metadata, active base pack ID, and active element overrides.
   - `POST`: Sets active base theme pack or selective element overrides.
2. Seed system bucket or local fallback theme packs:
   - Ensure packs have valid `manifest.json`, semantic tokens, and element styles.

### Phase 5: Build the Interactive Theme Browser Component
1. Create `components/settings/ThemeBrowserModal.tsx` (or `ThemePacksSection.tsx`):
   - **Section A: Base Theme Pack Grid**: Visual cards for each theme pack showing name, mode badge, author, and color swatch preview. Clicking activates the theme pack across the entire app.
   - **Section B: Per-Element Theme Overrides**: Dropdown table for key socket elements (`card`, `buttonPrimary`, `headerBar`, `codeEditor`, etc.) allowing the user to override individual elements with alternative theme packs or revert to `__base__`.
   - **Section C: Theme Engine Health & Telemetry**: Expandable inspector badge reporting:
     - Active Base Pack & Mode
     - Registered Socket Elements count
     - Active Element Overrides count
     - Uncovered Elements (falling back to socket defaults)
     - Ignored Elements (in theme pack but unused by this app)
   - Reset All Overrides button (`clearAllOverrides`).

---

## 2. CANONICAL CODE IMPLEMENTATION TEMPLATES

### 2.1 The App Theme Socket (`lib/theme-socket.ts`)

```typescript
// ══════════════════════════════════════════════════════════════════════════════════════
// APP THEME SOCKET SPECIFICATION
// ══════════════════════════════════════════════════════════════════════════════════════

export interface AppUIElementThemeValue {
  cssVars?: Record<string, string>;
  styles?: Record<string, string | number>;
  effects?: {
    animation?: string;
    transition?: string;
    glow?: string;
    filter?: string;
  };
  assets?: {
    wallpaper?: string;
    overlayImage?: string;
    texture?: string;
  };
}

export interface AppThemeSocket {
  appId: string;
  appName: string;
  version: string;
  elementIds: string[];
  defaultThemePackId: string;
  elementDefaults: Record<string, AppUIElementThemeValue>;
}

export const APP_ELEMENT_IDS: string[] = [
  'canvas',
  'canvasGrid',
  'topToolbar',
  'bottomStrip',
  'workspaceTabBar',
  'card',
  'modalDialog',
  'buttonPrimary',
  'buttonSecondary',
  'inputField',
  'selectDropdown',
  'badge'
];

export const appThemeSocket: AppThemeSocket = {
  appId: 'my-app',
  appName: 'My Skipo App',
  version: '1.0.0',
  elementIds: APP_ELEMENT_IDS,
  defaultThemePackId: 'skipo-default-dark',
  elementDefaults: {
    canvas: { cssVars: { '--skipo-bg': '#0f0f12' } },
    topToolbar: { cssVars: { '--skipo-top-toolbar-bg': 'rgba(15, 15, 18, 0.95)' } },
    bottomStrip: { cssVars: { '--skipo-bottom-strip-bg': 'rgba(15, 15, 18, 0.95)' } },
    card: { cssVars: { '--skipo-surface': '#18181b', '--skipo-border': '#27272a' } },
    buttonPrimary: { cssVars: { '--skipo-accent': '#e4e4e7', '--skipo-accent-fg': '#09090b' } }
  }
};
```

### 2.2 The Theme Pack Browser Component (`components/theme/ThemeBrowser.tsx`)

```tsx
// ══════════════════════════════════════════════════════════════════════════════════════
// THEME PACK BROWSER & ELEMENT OVERRIDE INSPECTOR
// ══════════════════════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, RotateCcw, Activity, Layers, ChevronDown } from 'lucide-react';
import { useSkipoTheme } from '@/lib/theme-provider'; // or @skipo/ui

interface ThemePackSummary {
  id: string;
  name: string;
  version: string;
  mode: 'dark' | 'light';
  author?: string;
  description?: string;
  accent?: string;
  base?: string;
}

export default function ThemeBrowser({
  availablePacks = []
}: {
  availablePacks: ThemePackSummary[];
}) {
  const {
    theme,
    engine,
    status,
    elementOverrides,
    setTheme,
    setElementOverride,
    clearElementOverride
  } = useSkipoTheme();

  const [inspectTelemetry, setInspectTelemetry] = useState(false);
  const activeBasePackId = engine?.getActiveBasePackId() || '';

  return (
    <div className="space-y-4 font-mono text-xs text-[var(--skipo-text)]">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[var(--skipo-border)] pb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Palette size={16} className="text-[var(--skipo-accent)]" />
            THEME PACK REPOSITORY
          </h3>
          <p className="text-[10px] text-[var(--skipo-text-muted)]">
            System Bucket Plug & Socket Theme Architecture
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`px-3 py-1 text-[10px] font-bold uppercase border border-[var(--skipo-border)] transition-all ${
              theme === 'dark' ? 'bg-[var(--skipo-accent)] text-[var(--skipo-accent-fg)]' : 'bg-transparent'
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`px-3 py-1 text-[10px] font-bold uppercase border border-[var(--skipo-border)] transition-all ${
              theme === 'light' ? 'bg-[var(--skipo-accent)] text-[var(--skipo-accent-fg)]' : 'bg-transparent'
            }`}
          >
            Light
          </button>
        </div>
      </div>

      {/* Base Theme Pack Selection Grid */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--skipo-text-muted)]">
          Available System Theme Packs
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availablePacks.map((pack) => {
            const isSelected = activeBasePackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => engine?.setBaseThemePack(pack.id)}
                className={`flex items-center justify-between p-2.5 text-left border transition-all ${
                  isSelected
                    ? 'border-[var(--skipo-accent)] bg-[var(--skipo-surface)] shadow-sm'
                    : 'border-[var(--skipo-border)] bg-black/10 hover:border-[var(--skipo-text-muted)]'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-bold truncate flex items-center gap-1.5">
                    {pack.name}
                    {isSelected && <Check size={12} className="text-[var(--skipo-accent)]" />}
                  </div>
                  <div className="text-[9px] text-[var(--skipo-text-muted)] truncate">
                    {pack.description || `${pack.mode.toUpperCase()} MODE`}
                  </div>
                </div>
                {pack.accent && (
                  <span
                    className="w-4 h-4 border border-[var(--skipo-border)] rounded-full shrink-0"
                    style={{ backgroundColor: pack.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-Element Overrides */}
      <div className="border border-[var(--skipo-border)] bg-black/10 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase flex items-center gap-1.5">
            <Layers size={14} className="text-[var(--skipo-accent)]" />
            Selective UI Element Overrides
          </h4>
          {Object.keys(elementOverrides).length > 0 && (
            <button
              type="button"
              onClick={() => engine?.clearAllOverrides()}
              className="text-[9px] uppercase text-[var(--skipo-accent)] hover:underline flex items-center gap-1"
            >
              <RotateCcw size={10} />
              Reset All
            </button>
          )}
        </div>
        <p className="text-[9px] text-[var(--skipo-text-muted)]">
          Override individual UI element styling with independent theme packs.
        </p>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {engine?.getSocket().elementIds.map((elId) => {
            const currentOverride = elementOverrides[elId] || '__base__';
            return (
              <div key={elId} className="flex items-center justify-between gap-2 py-1 border-b border-[var(--skipo-border)]/40">
                <span className="text-[10px] font-mono truncate">{elId}</span>
                <select
                  value={currentOverride}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__base__') clearElementOverride(elId);
                    else setElementOverride(elId, val);
                  }}
                  className="bg-[var(--skipo-surface)] border border-[var(--skipo-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--skipo-text)]"
                >
                  <option value="__base__">Default (Base Pack)</option>
                  {availablePacks.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telemetry & Health Inspector */}
      {status && (
        <div className="border border-[var(--skipo-border)] bg-black/20 p-2.5">
          <button
            type="button"
            onClick={() => setInspectTelemetry(!inspectTelemetry)}
            className="w-full flex items-center justify-between text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]"
          >
            <span className="flex items-center gap-1.5">
              <Activity size={12} className="text-[var(--skipo-accent)]" />
              Theme Engine Telemetry ({status.registeredElementsCount} elements)
            </span>
            <ChevronDown size={12} className={`transition-transform ${inspectTelemetry ? 'rotate-180' : ''}`} />
          </button>
          {inspectTelemetry && (
            <div className="mt-2 pt-2 border-t border-[var(--skipo-border)]/40 text-[9px] space-y-1 font-mono">
              <div>Active Pack: <span className="text-[var(--skipo-accent)]">{status.activeBasePackName}</span></div>
              <div>Active Overrides: {status.elementOverridesCount}</div>
              <div>Uncovered (Fallback): {status.uncoveredElements.length}</div>
              <div>Ignored (Unused in Pack): {status.ignoredElements.length}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 3. VERIFICATION & EXIT CRITERIA

Execute the following verification checklist before considering the theme integration complete:

```bash
# 1. Verify zero legacy ad-hoc theme presets or color pickers remain:
grep -rn "DEFAULT_THEME_PRESETS\|UI_ELEMENT_COLOR_FIELDS\|CustomThemeConfig" src/ lib/ components/

# 2. Verify all UI elements consume canonical CSS variables:
python3 assistant.py validate . --aspect aspect_02

# 3. Verify file line limits and code limits (all files <= 200L):
python3 assistant.py validate . --aspect aspect_04

# 4. Verify test integrity and full system pass:
python3 assistant.py validate .
```
Exit code **0** from `assistant.py validate .` is strictly mandatory.
