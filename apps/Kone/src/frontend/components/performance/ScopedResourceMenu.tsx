'use client';

import { useState } from 'react';
import { TilesMenu } from '@ultrst-armada/floks/ui';
import type { ScopedResource } from './performanceResources.js';

export function ScopedResourceMenu<T extends { id: string; name: string }>({ title, subtitle, resources, ownScope, onCreate, onSelect }: {
  title: string; subtitle: string; resources: ScopedResource<T>[]; ownScope: ScopedResource<T>['scope'];
  onCreate: () => void; onSelect: (resource: T) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const tiles = resources.map(({ resource, scope, inherited }) => ({
    id: resource.id, title: resource.name,
    description: inherited ? `Inherited from ${scope}` : `Owned by ${scope}`,
  }));
  return <TilesMenu
    id={`kone.${ownScope}.${title.toLowerCase().replace(/\s+/g, '-')}`}
    title={title} subtitle={subtitle} tiles={tiles}
    emptyText={`No ${title.toLowerCase()} yet.`} createLabel="ADD" onCreate={onCreate}
    onSelect={(tile) => { setSelected(tile.id); const found = resources.find(({ resource }) => resource.id === tile.id); if (found) onSelect(found.resource); }}
    renderTile={(tile) => <><div style={{ fontSize: 12, fontWeight: 700 }}>{tile.title}</div><div style={{ marginTop: 6, fontSize: 10, opacity: tile.id === selected ? 1 : 0.7 }}>{tile.description}</div></>}
  />;
}
