---
name: code-editor-guidelines
description: Directives for embedding Monaco Editor for all code snippets, JSON viewers, TypeScript source displays, and syntax-highlighted IDE interfaces across all Krnl and Skipo applications.
---

# MONACO CODE EDITOR INTEGRATION GUIDELINES (`code-editor`)

## 1. MANDATORY MONACO EDITOR STANDARD
```
∀ ui_component ∈ UI_Components:
  if contains_code_snippet(ui_component) ∨ contains_json_viewer(ui_component) ∨ contains_source_editor(ui_component):
    renderer(ui_component) ≡ Monaco_Editor
    FORBID: Plain <textarea> for code/JSON editing.
    FORBID: Plain <pre> or <code> blocks for multi-line interactive code display.
```
- **Universal Code Rendering**: Every section of an application that displays, inspects, or allows editing of code, JSON, SQL, or schemas MUST use the **Monaco Editor** library (`monaco-editor`).
- **Professional IDE Interface**: Monaco provides native line numbers, syntax highlighting, bracket matching, indentation guides, code folding, auto-completion, and error diagnostics.

---

## 2. THEME & VISUAL ALIGNMENT (`krnl-dark`)
Monaco Editor instances must register and use a custom theme aligned with the locked **Neo-Brutalist 2.5D Black-and-Gold** palette:

```javascript
monaco.editor.defineTheme('krnl-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'd4af37', fontStyle: 'bold' },
    { token: 'string', foreground: '98c379' },
    { token: 'number', foreground: 'd19a66' },
    { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
    { token: 'type', foreground: 'e5c07b' },
    { token: 'identifier', foreground: 'f5ede4' }
  ],
  colors: {
    'editor.background': '#16161e',
    'editor.foreground': '#f5ede4',
    'editor.lineHighlightBackground': '#1f1f2a',
    'editorLineNumber.foreground': '#5c6370',
    'editorLineNumber.activeForeground': '#d4af37',
    'editorCursor.foreground': '#d4af37',
    'editor.selectionBackground': '#2d3139',
    'editorWidget.background': '#16161e',
    'editorWidget.border': '#d4af37'
  }
});
```

---

## 3. CONFIGURATION PRESETS

### 3.1 Interactive Code Editor (e.g. Test Input / Scripts):
```javascript
const editor = monaco.editor.create(container, {
  value: initialCode,
  language: 'json', // or 'typescript', 'javascript', 'sql'
  theme: 'krnl-dark',
  automaticLayout: true,
  fontSize: 12,
  fontFamily: 'Fira Code, Menlo, Monaco, "Courier New", monospace',
  lineNumbers: 'on',
  minimap: { enabled: false }, // disable for compact panels
  scrollBeyondLastLine: false,
  renderLineHighlight: 'all',
  tabSize: 2
});
```

### 3.2 Read-Only Code Viewer (e.g. Generated VanJS / Execution Output):
```javascript
const viewer = monaco.editor.create(container, {
  value: sourceCode,
  language: 'typescript',
  theme: 'krnl-dark',
  readOnly: true,
  automaticLayout: true,
  fontSize: 12,
  fontFamily: 'Fira Code, Menlo, Monaco, "Courier New", monospace',
  lineNumbers: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on'
});
```

---

## 4. VANJS INTEGRATION PATTERN (`KrnlMonacoEditor`)
Wrap Monaco instances into self-contained VanJS reactive atoms:
```typescript
import van from 'vanjs-core';
import * as monaco from 'monaco-editor';

export interface KrnlMonacoProps {
  value?: string | van.State<string>;
  language?: string;
  readOnly?: boolean;
  onChange?: (val: string) => void;
  style?: string;
}

export function KrnlMonacoEditor(props: KrnlMonacoProps): HTMLElement {
  const container = van.tags.div({
    class: 'krnl-monaco-container',
    style: props.style || 'width: 100%; height: 100%; border: 1px solid rgba(212,175,55,0.25); border-radius: 6px; overflow: hidden;'
  });

  queueMicrotask(() => {
    const editor = monaco.editor.create(container, {
      value: typeof props.value === 'object' && 'val' in props.value ? props.value.val : (props.value || ''),
      language: props.language || 'typescript',
      theme: 'krnl-dark',
      readOnly: props.readOnly ?? false,
      automaticLayout: true,
      fontSize: 12,
      minimap: { enabled: false }
    });

    if (props.onChange) {
      editor.onDidChangeModelContent(() => {
        props.onChange!(editor.getValue());
      });
    }
  });

  return container;
}
```
