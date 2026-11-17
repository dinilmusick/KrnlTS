# AGENTS.md: SKIPO GOVERNANCE & ENFORCEMENT KERNEL

$$\text{Valid}(\mathcal{P}) \iff \text{Planes}(\mathcal{P}) \wedge \text{AntiStub}(\mathcal{P}) \wedge \text{DeterministicTooling}(\mathcal{P}) \wedge (\text{ExitCode}(\text{Validator}(\mathcal{P})) = 0)$$

## 1. INVIOLABLE LAWS (BLOCKING)

$$\begin{array}{ll}
\mathbf{L_1} \text{ (Plane Isolation)} & \text{src/flat} \implies \text{HALT} \wedge \text{Mutate}(\text{src/frontend}, \text{src/backend}, \text{packages/*}) \\
\mathbf{L_2} \text{ (Anti-Stub)} & \forall f \in \text{Code}: \text{Statements}(f) \ge 2 \wedge f \cap \{\text{TODO}, \emptyset, \text{no-op}, \text{trivial-return}\} = \emptyset \\
\mathbf{L_3} \text{ (Real Driver)} & \forall s \in \text{Services}: s \xrightarrow{\text{invoke}} \{\text{@aws-sdk}, \text{sqlite3}, \text{pg}, \text{fetch}, \text{@skipo/backend}, \text{crypto}\} \\
\mathbf{L_4} \text{ (Verification)} & \text{TurnDone} \implies \text{exitCode}(\text{checklists/full\_system\_validator.py}) == 0 \\
\mathbf{L_5} \text{ (Deterministic Tooling)} & \forall a \in \text{NewArtifacts}: a \in \text{Generators}(\text{generators/}) \vee a \in \text{Mutators}(\text{mutators/}) \\
\mathbf{L_6} \text{ (Workspace Isolation Gate)} & \forall a \in \text{Apps}: (\neg \text{ActiveWorkspace}) \implies \text{Gate}(\text{WorkspaceTilesMenu}) \wedge \neg \text{Render}(\text{AppCanvas}) \\
\mathbf{L_7} \text{ (App Architecture Spec)} & \forall a \in \text{Apps}: \text{src} \implies \{\text{frontend}, \text{backend}, \text{libraries}, \text{frontend-state}\} \wedge \text{SingleFacade}(a) \wedge \text{PreserveRoot}(a) \\
\mathbf{L_8} \text{ (Universal Adapter & Polyglot Entry)} & \forall a \in \text{Apps}: \text{UniversalEntry}(a) \equiv \text{src/backend/adapters/universalEntry.ts} \wedge \text{ExportsObject}(\text{fetch}) \wedge \text{ExpressLayers}(a) = \emptyset \wedge \text{IdenticalRoutes}(\text{Vercel}, \text{Cloudflare}, \text{Node}) \\
\mathbf{L_9} \text{ (Bottom Bar Exclusivity & Line Limits)} & \text{BottomStripCenter} \equiv \text{DynamicHoverInspectionOnly} \wedge \forall f \in \text{SourceFiles}: \text{Lines}(f) \le 200 \\
\mathbf{L_{10}} \text{ (Responsive Grids & Magnetic Auto-Spawn)} & \Delta(\text{TileContainer}) \implies \Delta(\text{Cols}, \text{Rows}, \text{Sizes}) \wedge \text{WireDragDrop}(\text{Canvas}) \implies \text{Picker} \xrightarrow{\text{select}} \text{Spawn} \wedge \text{Connect} \\
\mathbf{L_{11}} \text{ (Serverless Budget & Runtime Safety)} & \text{Size}(\text{ServerlessFn}) \le 50\text{MB} \wedge \text{ServerlessWrites} \subseteq /tmp \wedge \text{Routers} \implies \text{typeof}(r) \equiv \text{'function'} \\
\mathbf{L_{12}} \text{ (Overlay Event Trapping & Themed Controls)} & \text{Overlay} \xrightarrow{\text{trap}} \{\text{Wheel}, \text{Pointer}, \text{Key}\} \wedge \neg\text{Leak}(\text{Canvas}) \wedge \text{Controls} \implies \{\text{CustomScrollbar}, \text{ThemedDropdown}\} \\
\mathbf{L_{13}} \text{ (Progressive Disclosure & Collapsible Dialogs)} & \forall d \in \text{Dialogs}: \text{PrimaryInputs}(d) \subset \text{Visible} \wedge \text{SecondaryCustomizations}(d) \subset \text{CompressedByDefault} \\
\mathbf{L_{14}} \text{ (Icon Purity \& Zero Double-Icons)} & \forall b \in \text{Buttons}: \text{Count}(\text{Icons}(b)) \le 1 \wedge \neg(\text{HasIcon}(b) \wedge \text{SymbolGlyph}(\text{Label}(b))) \\
\mathbf{L_{15}} \text{ (File Purity DAG)} & \forall f \in \text{Files}: \text{Grade}(f) \in \{P_0, P_1, P_2, P_3\} \wedge \text{ImportDAG}(f) \text{ acyclic} \wedge \text{NameSuffix}(f) \equiv \text{Grade}(f) \\
\mathbf{L_{16}} \text{ (Root Code & Enclave Purity)} & \forall f \in \text{CodeFiles}: \text{Dir}(f) \neq \text{Root} \wedge \text{TopDir}(f) \in \text{AllowedPlanes} \\
\mathbf{L_{17}} \text{ (Storage Deep-Link Transparency)} & \forall w \in \text{Workspaces}: \text{StorageOption}(w) \xrightarrow{\text{click}} (\text{RevealLocalFolder}(w) \vee \text{OpenCloudBucketConsole}(w)) \\
\mathbf{L_{18}} \text{ (4-Word UI Text Label Cap)} & \forall t \in \text{UITextLabels}: \text{WordCount}(t) \le 4 \wedge (\text{Desc}(el) > 4 \implies \text{D+HoverOnly}) \\
\mathbf{L_{19}} \text{ (D+Hover Description Mode)} & \text{Hover}(el) \implies (\neg \text{Key}('D') \implies \text{BottomStrip}(\text{Label}(el)) \wedge \text{Key}('D') \implies \text{BottomStrip}(\text{Desc}(el))_{\text{thin,small}}) \\
\mathbf{L_{20}} \text{ (Skipo Isolation & Library Hydration)} & \forall f \in \text{AppCode}: \text{Imports}(f) \cap \{\text{Skipo/}, \text{@/Skipo}, \text{../Skipo}\} = \emptyset \wedge \text{BaseAssets}(f) \subset \text{src/libraries/} \\
\mathbf{L_{21}} \text{ (Zero-Trace Legacy Purge)} & \forall s_{\text{legacy}} \in \text{LegacySystems}: \text{CompetesWith}(\text{Skipo}, s_{\text{legacy}}) \implies \text{PurgeEntirely}(s_{\text{legacy}}) \wedge \text{Trace}(s_{\text{legacy}}) = \emptyset \\
\mathbf{L_{22}} \text{ (Single Universal Build Pipeline)} & \text{Artifacts}(a) \equiv \{\text{dist/}, \text{api/index.js}\} \wedge \text{WranglerMain} \equiv \text{"api/index.js"} \wedge \text{EvalBanned}(a) \wedge \text{Lockfiles}(a) \equiv 1 \\
\mathbf{L_{23}} \text{ (Zero-Drift State & Storage Immutability)} & \forall a \in \text{Apps}: \text{WorkspaceData}(a) \subset \text{"ultrst-users"}.\text{app\_profiles} \wedge \text{StorageConfig}(w) \text{ immutable} \wedge \text{LocalFSMissing}(w) \implies \text{DesaturateTile}(w) \\
\mathbf{L_{24}} \text{ (Cloudflare Runtime & Asset Routing)} & \text{AssetsRunWorkerFirst} \equiv \text{true} \wedge \text{AssetPassthrough}(req) \wedge \neg\text{PathRewrite}(\text{"/index.html"}) \wedge \text{DefaultExport} \equiv \{\text{fetch}\}
\end{array}$$

## 2. DETERMINISTIC AGENT EXECUTION ALGORITHM

```
TurnStart(task):
  0. Library Hydration & Root Isolation:
       If Skipo/ exists at workspace root -> python3 assistant.py sync-libraries .
       (Copies base assets to src/libraries/skipo/ and bans direct imports from root Skipo/).

  1. Route & Advise:
       python3 assistant.py advise "<task description>"
       -> Inspect suggested commands and open linked architectural skill files.

  2. Mutate (if refactoring / migrating existing codebase):
       Flat monoliths    -> python3 assistant.py mutate planes <dir>
       Hardcoded colors  -> python3 assistant.py mutate tokens <dir>
       Missing banners   -> python3 assistant.py mutate sections <dir>
       Naming standards  -> python3 assistant.py mutate naming <dir>
       Files > 200 lines -> python3 assistant.py mutate split <file>
       Full auto-remedy  -> python3 assistant.py mutate all <dir>

  2.5 Audit (Purity & Line Limits):
       python3 code-purity-audit.py <target>

  3. Generate (AGGRESSIVE VALIDATION & AUTO-DELETE LOOP):
       Scaffold complete multi-file directory suites (zero manual boilerplate):
       Service Suite     -> python3 assistant.py generate service <name> (Auto-registers in facade)
       4-Plane Structure -> python3 assistant.py generate app-structure <path> --name <Name>
       Orchestration     -> python3 assistant.py generate orchestration <name>
       8-Gate Route      -> python3 assistant.py generate route <name>
       Component suite   -> python3 assistant.py generate component <path> --name <Name>
       Quad-Unit Entity  -> python3 assistant.py generate entity <path> --name <Name>
       Layout Shell      -> python3 assistant.py generate shell <path>
       Node Graph Suite  -> python3 assistant.py generate nodegraph <path> --name <Name>
       Full Sub-App Tree -> python3 assistant.py generate subapp <path> --name <Name>

       * CRITICAL ENFORCEMENT LOOP: Each generation command immediately executes relevant validators.
       * If ANY validator fails, the assistant IMMEDIATELY DELETES the non-compliant generated files/folders
         and returns the failure report, forcing clean generation rather than accumulating stale edits.

  4. Specialize & Implement:
       Inject bespoke business logic into the deterministic slots.
       Zero stubs. Zero raw HTML (<button>/<input>). 100% var(--skipo-*). <=200L.

  5. Gate (Mandatory Exit 0):
       python3 assistant.py validate .
       if exit != 0 -> run mutator auto-remediation -> re-test gate.
       if exit == 0 -> present evidence & scorecard -> Done.
```

## 3. ARCHITECTURAL SUBSYSTEM TRIAD

```
checklists/ : Aspect 01-09 Dynamic Python 3 Validators + full_system_validator.py
generators/ : Aspect 01-10 Multi-File Directory Generators + generate.py (SubApp Tree)
mutators/   : Aspect 01-04 Directory Restructuring & Token Normalizers + mutate.py
assistant.py: Master AI Coding Agent Router, Environment Adapter & Skill Guide
```
