import React, { useId, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from '../../frnl/store.js';

export interface FrnlTileRecord {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  metadata?: React.ReactNode;
}

export interface TilesMenuProps<T extends FrnlTileRecord = FrnlTileRecord> {
  id?: string;
  title: string;
  subtitle?: string;
  tiles: T[];
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  error?: string | null;
  createLabel?: string;
  onSelect: (tile: T) => void;
  onCreate?: () => void;
  renderTile?: (tile: T, selected: boolean) => React.ReactNode;
}

export const tilesMenuDefinition = defineFrnlComponent({
  name: 'tilesMenu',
  states: {
    idle: { name: 'idle', events: { search: { functionId: 'tilesMenu.idle.search' }, select: { functionId: 'tilesMenu.idle.select' }, create: { functionId: 'tilesMenu.idle.create' } }, visualParameters: {}, phases: { sustainPhase: { visualDefinition: { parameters: {} } } } },
    loading: { name: 'loading', events: {}, visualParameters: { opacity: 0.7 }, phases: { sustainPhase: { visualDefinition: { parameters: {} } } } },
    error: { name: 'error', events: { dismiss: { functionId: 'tilesMenu.error.dismiss' } }, visualParameters: {}, phases: { sustainPhase: { visualDefinition: { parameters: {} } } } },
  },
});

export function TilesMenu<T extends FrnlTileRecord>({
  id,
  title,
  subtitle,
  tiles,
  searchPlaceholder = 'Search...',
  emptyText = 'No tiles found.',
  loading = false,
  error = null,
  createLabel = 'NEW',
  onSelect,
  onCreate,
  renderTile,
}: TilesMenuProps<T>) {
  const store = useFloksFrnlStore();
  const generated = useId().replace(/[:/]/g, '');
  const componentId = id ?? `tilesMenu.${generated}`;
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const state = error ? 'error' : loading ? 'loading' : 'idle';
  const handlers = useMemo(() => ({
    'tilesMenu.idle.search': (value: unknown) => setQuery(String(value ?? '')),
    'tilesMenu.idle.select': (tile: unknown) => onSelect(tile as T),
    'tilesMenu.idle.create': () => onCreate?.(),
    'tilesMenu.error.dismiss': () => {},
  }), [onCreate, onSelect]);
  const frnl = useFrnlComponent({
    id: componentId,
    definition: tilesMenuDefinition,
    store,
    state,
    properties: { title, tileCount: tiles.length, query },
    handlers,
  });
  const filtered = tiles.filter((tile) => {
    const q = query.trim().toLowerCase();
    return !q || tile.title.toLowerCase().includes(q) || (tile.description ?? '').toLowerCase().includes(q);
  });

  return (
    <section id={componentId} data-frnl-component="tilesMenu" data-frnl-state={frnl.state} className="w-full font-mono text-[var(--skipo-text)]">
      <header className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[220px]">
          <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
          {subtitle && <p className="text-[10px] text-[var(--skipo-text-muted)] mt-1">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <label className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--skipo-text-muted)]" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); frnl.events.search(e.target.value); }} placeholder={searchPlaceholder} className="h-8 w-48 bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)] pl-8 pr-2 text-xs outline-none" />
          </label>
          {onCreate && <button type="button" onClick={() => frnl.events.create(undefined)} className="h-8 px-3 bg-[var(--skipo-accent)] text-black text-[10px] font-black uppercase flex items-center gap-1.5"><Plus size={13} />{createLabel}</button>}
        </div>
      </header>
      {error && <div className="mb-3 border border-red-500/70 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
      {loading ? <div className="border border-dashed border-[var(--skipo-border-color)] p-8 text-center text-xs text-[var(--skipo-text-muted)]">LOADING...</div> :
        filtered.length === 0 ? <div className="border border-dashed border-[var(--skipo-border-color)] p-8 text-center text-xs text-[var(--skipo-text-muted)]">{emptyText}</div> :
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((tile) => {
            const selected = selectedId === tile.id;
            return <button key={tile.id} type="button" onClick={() => { setSelectedId(tile.id); frnl.events.select(tile); }} className={`text-left p-4 border-2 bg-[var(--skipo-surface)] transition-colors ${selected ? 'border-[var(--skipo-accent)]' : 'border-[var(--skipo-border-color)] hover:border-[var(--skipo-accent)]'}`}>
              {renderTile ? renderTile(tile, selected) : <><div className="flex items-center gap-2 text-xs font-black uppercase">{tile.icon}{tile.title}</div><p className="mt-2 text-[11px] text-[var(--skipo-text-muted)]">{tile.description}</p>{tile.metadata && <div className="mt-2 text-[10px]">{tile.metadata}</div>}</>}
            </button>;
          })}
        </div>}
    </section>
  );
}
