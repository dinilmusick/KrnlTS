---
name: code-editor-guidelines
description: Directives for embedding Monaco Editor for all code snippets, JSON viewers, TypeScript source displays, and syntax-highlighted IDE interfaces across all Krnl and Skipo applications.
---

# MONACO EDITOR INTEGRATION (DENSE)

$$\forall c \in \text{CodeDisplays}: c \equiv \text{MonacoEditor} \quad \wedge \quad (\text{RawTextArea} \vee \text{PlainPreCode}) = \emptyset$$

## 1. PRESET CONFIGURATIONS

```javascript
// Interactive Editor:
const editor = monaco.editor.create(container, {
  value: code,
  language: 'typescript', // 'json', 'sql'
  theme: 'krnl-dark',
  automaticLayout: true,
  fontSize: 12,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  tabSize: 2
});

// Read-Only Viewer:
const viewer = monaco.editor.create(container, {
  value: sourceCode,
  language: 'typescript',
  readOnly: true,
  domReadOnly: true,
  theme: 'krnl-dark',
  automaticLayout: true
});
```

## 2. THEME DEFINITION (`krnl-dark`)

```javascript
monaco.editor.defineTheme('krnl-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'd4af37', fontStyle: 'bold' },
    { token: 'string', foreground: '98c379' },
    { token: 'type', foreground: 'e5c07b' }
  ],
  colors: {
    'editor.background': '#16161e',
    'editor.foreground': '#f5ede4',
    'editorLineNumber.activeForeground': '#d4af37'
  }
});
```

## 3. CHECKLIST GATE
`python3 checklists/02_ui_primitives_themes.py .`
