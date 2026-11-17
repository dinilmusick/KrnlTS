---
name: skipo-standalone-app-architecture
description: Architectural standard for building standalone applications (Next.js, React SPA, Electron) using @skipo/* modular packages with base classes, container inheritance, theme packs, and zero KrnlTS dependencies.
---

# SKIPO STANDALONE ARCHITECTURE (DENSE)

$$\text{App} = \langle \text{ThemePack}, \text{TopToolbar}_{44\text{px}}, \text{BottomStrip}_{30\text{px}}, \text{Primitives}, \text{BackendClient} \rangle$$

## 1. 13 INVIOLABLE LAWS

$$\begin{array}{ll}
\mathbf{L_1} \text{ (No Bespoke UI)} & \forall e \in \text{Controls}: e \in @\text{skipo/ui} \wedge e \notin \{\text{button}, \text{input}, \text{select}, \text{textarea}\} \\
\mathbf{L_2} \text{ (Flat Tabs)} & |\text{TopToolbar}| = 1 \wedge \text{TabNesting} = \emptyset \\
\mathbf{L_3} \text{ (No Float Text)} & \text{Tooltips} \subset \text{BottomStripContext} \wedge \text{FloatingBubbles} = \emptyset \\
\mathbf{L_4} \text{ (Icon-Only)} & \text{ActionButtons} = \text{MonochromaticGlyphs} \wedge \text{StaticTextLabels} = \emptyset \\
\mathbf{L_5} \text{ (Credential Link)} & \text{CredentialInput} \implies \text{CredentialField} \wedge \text{ExternalPortalLink} \ne \emptyset \\
\mathbf{L_6} \text{ (Theme Pack)} & \forall c \in \text{Styles}: c = \text{var}(--\text{skipo}-*) \wedge \text{HardcodedColors} = \emptyset \\
\mathbf{L_7} \text{ (Plane Split)} & \text{ControlPlane} \cap \text{DataPlane} = \emptyset \\
\mathbf{L_8} \text{ (Code Limits)} & |\text{Lines}(f)| \le 200 \wedge \text{Comps}(f) \le 1 \wedge \text{Purity}(L_0 \dots L_3) \\
\mathbf{L_9} \text{ (Details Panel)} & \text{Inspector} \implies \text{FloatingDetailsPanel}(\text{8WayResize}, \text{Pin}, \text{GeometryPersistence}) \\
\mathbf{L_{10}} \text{ (GitIgnore)} & \text{.gitignore} \models /\text{dist/} \wedge \text{unanchored}(\text{dist/}) = \emptyset \\
\mathbf{L_{11}} \text{ (Zero Mock)} & \text{Tokens} \cap \{\text{placeholder}, \text{lorem ipsum}, \text{dummy}\} = \emptyset \vee \langle\text{EmptyState}\rangle \\
\mathbf{L_{12}} \text{ (Verification)} & \text{Done} \iff \text{exit}(\text{python3 checklists/full\_system\_validator.py .}) == 0 \\
\mathbf{L_{13}} \text{ (Backend Surface)} & \text{Frontend} \xrightarrow{\text{imports}} @\text{skipo/backend/client} \wedge \text{DirectDriverImports} = \emptyset
\end{array}$$

## 2. CLIENT ACCESS PATTERN

```typescript
import { BackendProvider, useBackend } from '@skipo/backend/client';
// Root index.html: <div id="root"></div> + <script type="module" src="/src/main.tsx">
const { storage, auth } = useBackend();
const data = await storage.listFiles(workspaceId);
```
