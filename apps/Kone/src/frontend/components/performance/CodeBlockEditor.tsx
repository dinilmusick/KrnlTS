'use client';

import { useEffect, useState } from 'react';
import { BaseButton, BaseInput, BaseTextarea } from '@ultrst-armada/floks/ui';
import type { CodeBlockDefinition } from './performanceDomain.js';

export function CodeBlockEditor({ block, editable, onChange, onClose }: {
  block: CodeBlockDefinition; editable: boolean; onChange: (block: CodeBlockDefinition) => void; onClose: () => void;
}) {
  const [name, setName] = useState(block.name);
  const [code, setCode] = useState(block.code);
  useEffect(() => { setName(block.name); setCode(block.code); }, [block.id, block.name, block.code]);
  return <aside style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, height: '100%', padding: 12, borderLeft: 'var(--skipo-border)', background: 'var(--skipo-surface)' }}>
    <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}><strong style={{ fontSize: 12 }}>{editable ? 'JavaScript Code Block' : 'Inherited JavaScript Code Block'}</strong><BaseButton variant="secondary" size="sm" onClick={onClose}>Close</BaseButton>{editable && <BaseButton size="sm" onClick={() => onChange({ ...block, name: name.trim() || block.name, code })}>Save</BaseButton>}</header>
    <BaseInput value={name} onChange={(event) => setName(event.target.value)} readOnly={!editable} aria-label="Code block name" placeholder="Code block name" />
    <BaseTextarea value={code} onChange={(event) => setCode(event.target.value)} readOnly={!editable} aria-label="JavaScript code" spellCheck={false} style={{ flex: 1, minHeight: 320, resize: 'none', fontFamily: 'monospace' }} />
  </aside>;
}
