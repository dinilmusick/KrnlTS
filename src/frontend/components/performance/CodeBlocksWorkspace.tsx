'use client';

import { useState } from 'react';
import { ScopedResourceMenu } from './ScopedResourceMenu.js';
import { CodeBlockEditor } from './CodeBlockEditor.js';
import type { CodeBlockDefinition } from './performanceDomain.js';
import type { ScopedResource } from './performanceResources.js';

export function CodeBlocksWorkspace({ resources, ownScope, onCreate, onUpdate }: {
  resources: ScopedResource<CodeBlockDefinition>[]; ownScope: ScopedResource<CodeBlockDefinition>['scope'];
  onCreate: () => void; onUpdate: (block: CodeBlockDefinition) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEntry = resources.find(({ resource }) => resource.id === selectedId);
  const selected = selectedEntry?.resource;
  return <div style={{ height: '100%', minHeight: 0, display: 'grid', gridTemplateColumns: selected ? 'minmax(0, 1fr) 520px' : 'minmax(0, 1fr)' }}>
    <div style={{ overflow: 'auto', padding: 24 }}><ScopedResourceMenu title="Code Blocks" subtitle="Reusable JavaScript resources" resources={resources} ownScope={ownScope} onCreate={onCreate} onSelect={(block) => setSelectedId(block.id)} /></div>
    {selected && <CodeBlockEditor block={selected} editable={!selectedEntry?.inherited} onChange={onUpdate} onClose={() => setSelectedId(null)} />}
  </div>;
}
