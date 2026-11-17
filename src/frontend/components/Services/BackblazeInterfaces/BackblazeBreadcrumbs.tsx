'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { ArrowUp, ChevronRight, Search, LayoutList, LayoutGrid } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { BrutalistSelect } from '../../common/BrutalistSelect';
import { BackblazeBucket, ExplorerViewMode, ExplorerSortOption } from './backblazeTypes';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface BackblazeBreadcrumbsProps {
  currentPath: string;
  selectedBucket: BackblazeBucket | null;
  onNavigatePath: (path: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ExplorerViewMode;
  onViewModeChange: (mode: ExplorerViewMode) => void;
  sortOption: ExplorerSortOption;
  onSortChange: (opt: ExplorerSortOption) => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export const BackblazeBreadcrumbs: React.FC<BackblazeBreadcrumbsProps> = ({
  currentPath,
  selectedBucket,
  onNavigatePath,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
}) => {
  const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : [];

  return (
    <div
      className="flex items-center justify-between gap-2 p-1.5 text-[11px] border"
      style={{
        backgroundColor: 'var(--skipo-matte-bg)',
        borderColor: 'var(--skipo-border-color)',
      }}
    >
      <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 py-0.5">
        {pathSegments.length > 0 && (
          <BaseButton
            size="sm"
            variant="ghost"
            onClick={() => onNavigatePath(pathSegments.length <= 1 ? '' : pathSegments.slice(0, -1).join('/'))}
            className="p-1 cursor-pointer mr-1 h-6 min-w-6"
            title="Up one level"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </BaseButton>
        )}

        <BaseButton
          size="sm"
          variant="ghost"
          onClick={() => onNavigatePath('')}
          className={`font-bold cursor-pointer h-6 px-1.5 ${pathSegments.length === 0 ? 'text-amber-400' : 'text-neutral-400'}`}
        >
          {selectedBucket ? selectedBucket.name : 'root'}
        </BaseButton>

        {pathSegments.map((seg, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={() => onNavigatePath(pathSegments.slice(0, idx + 1).join('/'))}
              className={`font-bold cursor-pointer truncate max-w-[140px] h-6 px-1.5 ${idx === pathSegments.length - 1 ? 'text-amber-300' : 'text-neutral-400'}`}
            >
              {seg}
            </BaseButton>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative">
          <BaseInput
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter..."
            className="w-28 sm:w-36 pl-6 pr-2 py-0.5 text-[11px] font-mono"
          />
          <Search className="w-3 h-3 text-neutral-500 absolute left-2 top-1.5 pointer-events-none" />
        </div>

        <BrutalistSelect
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as ExplorerSortOption)}
          inspectionLabel="Sort Order"
          className="text-[10px] px-1.5 py-1 cursor-pointer"
        >
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="size_desc">Size (Large)</option>
          <option value="size_asc">Size (Small)</option>
          <option value="date_desc">Newest</option>
          <option value="date_asc">Oldest</option>
        </BrutalistSelect>

        <div className="flex border" style={{ borderColor: 'var(--skipo-border-color)' }}>
          <BaseButton
            size="sm"
            variant={viewMode === 'list' ? 'accent' : 'ghost'}
            onClick={() => onViewModeChange('list')}
            className="p-1 h-6 w-6"
            title="List View"
          >
            <LayoutList className="w-3.5 h-3.5" />
          </BaseButton>
          <BaseButton
            size="sm"
            variant={viewMode === 'grid' ? 'accent' : 'ghost'}
            onClick={() => onViewModeChange('grid')}
            className="p-1 h-6 w-6"
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </BaseButton>
        </div>
      </div>
    </div>
  );
};
