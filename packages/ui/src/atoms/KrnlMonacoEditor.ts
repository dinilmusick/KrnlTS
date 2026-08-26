import van, { type State } from 'vanjs-core';

export interface KrnlMonacoProps {
  value?: string | State<string>;
  language?: string;
  readOnly?: boolean;
  theme?: string;
  height?: string;
  width?: string;
  lineNumbers?: 'on' | 'off';
  minimap?: boolean;
  onChange?: (newValue: string) => void;
  class?: string;
  style?: string;
}

/**
 * KrnlMonacoEditor: Embeds a full-featured Monaco Code Editor instance
 * configured with the locked Neo-Brutalist krnl-dark theme.
 */
export function KrnlMonacoEditor(props: KrnlMonacoProps = {}): HTMLElement {
  const container = van.tags.div({
    class: `krnl-monaco-wrapper ${props.class || ''}`,
    style: `
      width: ${props.width || '100%'};
      height: ${props.height || '100%'};
      min-height: 120px;
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 8px;
      overflow: hidden;
      background: #16161e;
      position: relative;
      ${props.style || ''}
    `
  });

  // Lazy initialize Monaco Editor when attached to DOM
  queueMicrotask(() => {
    const win = window as any;
    const initialVal = typeof props.value === 'object' && props.value !== null && 'val' in props.value
      ? props.value.val
      : (props.value || '');

    const initEditor = () => {
      if (!win.monaco) return;

      // Define krnl-dark theme if not already defined
      try {
        win.monaco.editor.defineTheme('krnl-dark', {
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
      } catch (e) {}

      const editor = win.monaco.editor.create(container, {
        value: initialVal,
        language: props.language || 'typescript',
        theme: props.theme || 'krnl-dark',
        readOnly: props.readOnly ?? false,
        automaticLayout: true,
        fontSize: 12,
        fontFamily: 'Fira Code, Menlo, Monaco, "Courier New", monospace',
        lineNumbers: props.lineNumbers || 'on',
        minimap: { enabled: props.minimap ?? false },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'all',
        tabSize: 2
      });

      if (props.onChange) {
        editor.onDidChangeModelContent(() => {
          props.onChange!(editor.getValue());
        });
      }

      // If value is a reactive VanJS state, subscribe to external state changes
      if (typeof props.value === 'object' && props.value !== null && 'val' in props.value) {
        van.derive(() => {
          const currentVal = (props.value as State<string>).val;
          if (editor.getValue() !== currentVal) {
            editor.setValue(currentVal);
          }
        });
      }

      (container as any).__monacoEditor = editor;
    };

    if (win.monaco) {
      initEditor();
    } else if (win.require) {
      win.require(['vs/editor/editor.main'], initEditor);
    }
  });

  return container;
}
