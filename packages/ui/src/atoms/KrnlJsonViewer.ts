import van from 'vanjs-core';

const { div, h4, pre, code } = van.tags;

export interface KrnlJsonViewerProps {
  label?: string;
  data?: any;
}

export function KrnlJsonViewer({ label: labelText, data }: KrnlJsonViewerProps): HTMLElement {
  const dataState = typeof data === 'object' && 'val' in data ? data : van.state(data);

  return div(
    { class: 'krnl-json-viewer' },
    labelText ? h4({ style: 'margin-bottom: 0.5rem; color: var(--krnl-accent);' }, labelText) : null,
    pre(
      { class: 'krnl-json-code' },
      code(() => JSON.stringify(dataState.val, null, 2))
    )
  );
}
