export const skipoDarkTheme = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'd4af37' },     // Gold
    { token: 'string', foreground: '98c379' },      // Olive
    { token: 'number', foreground: 'd19a66' },      // Orange
    { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
    { token: 'type', foreground: '56b6c2' },        // Cyan
  ],
  colors: {
    'editor.background': '#16161e',
    'editor.foreground': '#a9b1d6',
    'editorLineNumber.foreground': '#363b54',
    'editor.selectionBackground': '#28324a',
    'editor.lineHighlightBackground': '#1c1c26',
    'editorCursor.foreground': '#d4af37',
    'editorIndentGuide.background': '#222222',
  }
};
