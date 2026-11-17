---
name: skipo-component-authoring
description: Strict guidelines and blueprints for authoring application-specific UI and backend components by inheriting from @skipo/ui base classes and @skipo/core / @skipo/backend foundations.
---

# SKIPO COMPONENT AUTHORING (DENSE)

$$\mathcal{C}_{\text{custom}} \subseteq @\text{skipo/ui} \quad \wedge \quad \text{RawHTML} = \emptyset$$

## 1. COMPONENT INHERITANCE MAP

```
BaseButton / IconOnlyButton   --> All click actions (monochromatic SVG, zero static text in actions)
BaseInput / CredentialField    --> All form inputs (CredentialField mandatory for API keys)
BaseSelect / BaseTextarea      --> Selectors and multiline text
BaseCard / PageContainer       --> Layout shells and surface containers
TopToolbar                     --> Root app header (44px, flat tabs only, zero nested tabs)
BottomStrip                    --> Root app footer (30px, hover inspection text via BottomStripContext)
FloatingDetailsPanel           --> Record/node inspector (8-way resize, drag, pin, usePanelGeometry)
EmptyState                     --> Zero-data fallback (mandatory when arrays empty; zero mocks)
```

## 2. CANONICAL BLUEPRINTS

```tsx
// 1. Icon-Only Action (Hover text routes to BottomStrip)
<IconOnlyButton variant="danger" label="DELETE ITEM" onClick={handleDelete} icon={<TrashSvg />} />

// 2. Credential Field (Mandatory link to provider console)
<CredentialField serviceId="openai" value={apiKey} onChange={e => setKey(e.target.value)} />

// 3. Floating Details Panel (Pinnable, Resizable, Persistent)
<FloatingDetailsPanel title={entity.name} isPinned={pinned} onTogglePin={() => setPinned(!pinned)} onClose={close}>
  <EntityDetails entity={entity} />
</FloatingDetailsPanel>

// 4. Flat TopToolbar (Zero nested tabs allowed)
<TopToolbar title="APP_NAME" tabs={FLAT_TABS} activeTabId={tab} onSelectTab={setTab} />
```

## 3. CHECKLIST GATE
`python3 checklists/02_ui_primitives_themes.py .` && `python3 checklists/03_layout_shell_invariants.py .`
