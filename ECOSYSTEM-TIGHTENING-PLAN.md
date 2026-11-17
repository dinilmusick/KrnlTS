# SKIPO Ecosystem Tightening Plan

## Purpose
Formalize the SKIPO ecosystem so reusable backend services, their UI contracts, FLOKS UI assets, application composition, generated UI, and downstream provenance form one deterministic system.

Authority boundaries:

~~~text
SKIPO   = scaffold / governance / generation / application contracts
KrnlTS  = backend service framework
KLOKS   = reusable backend services + service contracts
FLOKS   = reusable frontend components + sections
KRUSBL  = discovery / provenance / compatibility / orchestration
~~~

KRUSBL consumes these authorities; it does not create a competing contract system.

## 1. Service UI Contract
Every KLOKS service that exposes a frontend experience MUST have a UI schema.

The schema MAY be embedded in the service facade, but the preferred structure is a separate typed module imported or re-exported by the facade:

~~~text
services/
  auth/
    auth.facade.ts
    auth.ui.ts
~~~

The facade remains the public service entrypoint and exposes the UI contract through the service namespace.

Conceptual API:
~~~ts
AuthService.ui
~~~

The UI schema is a first-class part of the service contract, not an unrelated application manifest.

### UI requirement mode
Every UI-capable service MUST declare one of:
- none
- optional
- required

If required, SKIPO validation MUST detect an application that imports the service but never consumes its UI namespace.

## 2. Canonical UI Hierarchy
The formal hierarchy is:

~~~text
Service
  └── UI
       └── Page
            └── Section
                 └── Component
~~~

Every service with UI MUST expose a canonical UI page.

Conceptual namespace:

~~~text
Service.ui
Service.ui.<Section>
Service.ui.<Section>.<Component>
~~~

Examples: Auth.ui, Auth.ui.LoginSection, Auth.ui.LoginSection.EmailField, Auth.ui.LoginSection.SubmitButton.

## 3. UI Schema Ownership
The service UI schema defines composition; it does not invent application-specific visual implementations.

A service UI schema MUST resolve to reusable UI assets owned by an approved frontend package/library.

~~~text
KLOKS service + UI contract
          ↓
FLOKS reusable visual assets
          ↓
SKIPO resolution + generation
          ↓
Application placement + customization
~~~

Future extensions such as FLOKS 2 MUST participate through the same asset-resolution contract.

## 4. FLOKS UI Asset Levels
FLOKS MUST support both atomic components and reusable global sections.

Examples of components: Button, Input, PasswordInput, StatusIndicator.

Examples of sections: Auth/Login and Workspace/Tiles.

A section is a reusable composition of components with a stable public contract. Application-specific business logic or branding MUST NOT leak into the canonical FLOKS implementation.

## 5. Canonical Auth + Workspace Migration
The working DEPM-Engine implementation is the behavioral and visual reference for canonical Auth and Workspace experiences.

~~~text
DEPM working implementation
          ↓
FLOKS canonical Auth + Workspace
          ↓
      +---+---+
      ↓       ↓
    DEPM    KRUSBL
~~~

DEPM and KRUSBL MUST consume the same public FLOKS exports. There MUST NOT be three independently maintained canonical implementations.

Completion invariant:
~~~text
DEPM Auth      === FLOKS Auth      === KRUSBL Auth
DEPM Workspace === FLOKS Workspace === KRUSBL Workspace
~~~

=== means the same canonical FLOKS implementation/contract, not merely similar styling.

## 6. SKIPO Programmatic UI Generation
SKIPO MUST provide deterministic generation/composition tooling that consumes a service UI schema.

~~~text
Add Service
   ↓
Read Service Facade
   ↓
Resolve Service UI Schema
   ↓
Resolve FLOKS Assets
   ↓
Generate Initial React Composition
   ↓
Application Source
~~~

Generated output MUST be ordinary editable React/TypeScript source. Generation is an accelerator and consistency mechanism, not runtime lock-in.

After generation the application/coding agent MUST be able to move sections, compose them, wrap components, replace optional pieces, alter layout, and add application-specific behavior.

## 7. Declarative Application Composition
Application React composition MUST support service UI namespaces at page, section, and component granularity.

~~~tsx
<MainPage>
  <Header>
    <Auth.ui.LoginSection />
    <Workspace.ui.TilesSection />
  </Header>
</MainPage>
~~~

The generated implementation may use ordinary imports, wrappers, or adapters, but the source must retain an unambiguous relationship to the originating service UI asset.

## 8. Service/UI Consistency Validation
SKIPO MUST validate the relationship between backend service installation and frontend UI usage.

~~~text
Application imports AuthService
AuthService.ui = required
Frontend contains no Auth.ui usage
            ↓
      VALIDATION FAIL
~~~

Optional UI may be omitted. Validation MUST detect unresolved UI assets, nonexistent page/section/component paths, unapproved/private package paths, missing FLOKS exports, stale package/export identifiers, and duplicate local canonical implementations.

## 9. Scaffold Canonicalization
This is mandatory. SKIPO scaffolds are the starter source for SKIPO applications. ALL scaffold paths, templates, and generators MUST produce applications that consume the canonical FLOKS Auth and Workspace implementations.

Scaffolds MUST NOT recreate, embed, or fork canonical Auth/Workspace implementations.

Required direction:
~~~text
SKIPO scaffold
    ├── @ultrst-armada/kloks
    └── @ultrst-armada/floks
             ├── canonical Auth
             └── canonical Workspace
~~~

Scaffolded applications MUST resolve Auth and Workspace through the public FLOKS package API.

Forbidden: copied DEPM source, copied FLOKS source, deep/private FLOKS source paths, stale local Auth/Workspace components, or scaffold-specific canonical forks.

Every maintained scaffold variant MUST be checked for canonical FLOKS Auth and Workspace resolution, absence of local duplicates, login/authenticated/logout flow, workspace loading/selection/switching, workspace CRUD where supported, storage behavior, and routing/state transitions.

Updating only an example application is insufficient; the scaffold generator and every maintained scaffold template must be updated together.

## 10. Scaffold Database Environment Contract
The current scaffold database environment contract MUST be tightened.

### Remove obsolete DATABASE_URL
Scaffolds MUST NOT declare or generate a generic DATABASE_URL when the architecture uses system database URLs.

Remove DATABASE_URL references from scaffold environment examples, templates, generated documentation, generated configuration, runtime lookup code, and tests/fixtures asserting the obsolete variable.

### Canonical variables
Use exactly:

~~~text
SYSTEM_DATABASE_URL_1
SYSTEM_DATABASE_URL_2
SYSTEM_DATABASE_URL_3
~~~

Precedence:

~~~text
SYSTEM_DATABASE_URL_1 → primary
SYSTEM_DATABASE_URL_2 → fallback #1
SYSTEM_DATABASE_URL_3 → fallback #2
~~~

Resolution:

~~~text
if 1 exists: use 1
else if 2 exists: use 2
else if 3 exists: use 3
else: fail with an explicit missing-system-database configuration error
~~~

The implementation MUST NOT silently fall back to DATABASE_URL. SYSTEM_DATABASE_URL_1 is the required primary endpoint; 2 and 3 are fallbacks. The resolver SHOULD be centralized so services do not implement different precedence algorithms.

## 11. Package/Public-API Enforcement
Applications and generated scaffolds MUST consume KLOKS/FLOKS through public package exports.

Allowed:
~~~ts
import { ... } from '@ultrst-armada/kloks/...'
import { ... } from '@ultrst-armada/floks/...'
~~~

Forbidden: repository-relative source imports, copied package source, private/deep implementation paths, or assumptions about another repository's folder layout.

SKIPO generation MUST resolve against package export maps.

## 12. Provenance Requirements
SKIPO generation MUST preserve enough information for KRUSBL to recover:

~~~text
Application
  → package
  → package version
  → public export
  → service/UI asset
  → page
  → section
  → component
  → generated source location
~~~

KRUSBL must distinguish library-owned source, generated application composition, application customization, and fully application-owned code where provenance is available.

## 13. Future Library Extensions
The system MUST NOT special-case only KLOKS and FLOKS. Future package generations/extensions such as KLOKS 2 and FLOKS 2 must use the same resolution model.

Resolution is based on package identity, version, public exports, declared service/UI contract, asset identity, and compatibility metadata.

## 14. KRUSBL Discovery Target
KRUSBL should be able to scan any SKIPO application and derive an asset-level dependency graph.

~~~text
Application
  → package
      → export
          → service
          → UI asset
              → page
              → section
              → component
~~~

Analysis pipeline:
~~~text
Package Scanner
      ↓
AST Import Analyzer
      ↓
Module Resolver
      ↓
Export Resolver
      ↓
Contract Resolver
      ↓
Provenance Graph
~~~

Transitive imports MUST be followed to the resolved public asset.

## 15. Validation and Acceptance Gates
### Service contract
- Every UI-capable service has a valid UI schema.
- Schema may be separate from the facade and imported by it.
- Page → Section → Component resolution works.
- UI requirement mode is explicit.

### FLOKS
- Canonical Auth exists.
- Canonical Workspace exists.
- Public exports are stable.
- DEPM-specific assumptions are removed from reusable package code.
- No duplicate canonical implementation remains.

### SKIPO
- Scaffold generator emits canonical FLOKS Auth/Workspace.
- All scaffold variants consume the same public FLOKS API.
- Programmatic service UI generation works.
- Generated code remains editable.
- Required/optional/none UI validation works.
- Invalid UI asset references fail deterministically.
- Generic DATABASE_URL is absent from generated scaffold configuration.
- SYSTEM_DATABASE_URL_1 > SYSTEM_DATABASE_URL_2 > SYSTEM_DATABASE_URL_3 precedence is centralized and enforced.

### Applications
- DEPM consumes canonical FLOKS Auth/Workspace.
- KRUSBL consumes canonical FLOKS Auth/Workspace.
- Login/workspace behavior remains equivalent to the DEPM reference.
- No local canonical forks remain.

### KRUSBL
- Package-level dependencies resolve to actual consumed exports/assets.
- Service/UI relationships are discoverable.
- Generated versus customized code can be distinguished where provenance is available.
- Future package extensions do not require hard-coded KLOKS/FLOKS special cases.

## 16. Implementation Order
1. Finalize FLOKS canonical Auth/Workspace public API.
2. Migrate DEPM to canonical FLOKS exports.
3. Migrate KRUSBL to the same exports.
4. Formalize the KLOKS service UI schema type/contract.
5. Implement/upgrade SKIPO UI schema resolution.
6. Implement Page → Section → Component resolution.
7. Implement FLOKS asset resolution through public exports.
8. Implement deterministic React composition/generation.
9. Add required/optional/none UI validation.
10. Update ALL SKIPO scaffold generators/templates to use canonical FLOKS Auth/Workspace.
11. Remove obsolete DATABASE_URL from all scaffold generation paths.
12. Implement centralized SYSTEM_DATABASE_URL_1/2/3 resolution with 1 → 2 → 3 precedence.
13. Add scaffold regression tests.
14. Add package/public-export validation.
15. Add provenance metadata/analysis hooks required by KRUSBL.
16. Run full SKIPO validation and downstream consumer builds/typechecks/tests.

## 17. Non-Goals / Boundaries
- KRUSBL is not the owner of KLOKS/FLOKS contracts.
- Do not duplicate KLOKS/FLOKS source into applications.
- Do not create a second manually maintained UI manifest when the typed service UI contract provides the authority.
- Generated UI is editable and customizable.
- Applications may consume a whole page or a smaller section/component.
- DEPM-specific business logic must not leak into FLOKS.
- Normal React composition remains valid.
- DATABASE_URL is not a fallback.
- The architecture must not hard-code only the current KLOKS/FLOKS package names.

## Governing Model
~~~text
SERVICE CONTRACT
      +
UI SCHEMA
      +
PUBLIC LIBRARY ASSETS
      +
DETERMINISTIC SKIPO GENERATION
      +
APPLICATION CUSTOMIZATION
      +
KRUSBL PROVENANCE
      =
TIGHT, TRACEABLE SKIPO ECOSYSTEM
~~~

