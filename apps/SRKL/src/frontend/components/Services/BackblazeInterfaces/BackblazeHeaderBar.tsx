'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { Database, RefreshCw, Upload, FolderPlus, Plus, Trash2, Radio } from 'lucide-react';
import { BaseButton } from '@skipo/ui';
import { BrutalistSelect } from '../../common/BrutalistSelect';
import { BaseIconButton } from '../../common/BaseIconButton';
import { BackblazeBucket, ExplorerViewMode, ExplorerSortOption } from './backblazeTypes';
import { BackblazeBreadcrumbs } from './BackblazeBreadcrumbs';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface BackblazeHeaderBarProps {
  buckets: BackblazeBucket[];
  selectedBucket: BackblazeBucket | null;
  onSelectBucket: (bucket: BackblazeBucket) => void;
  onNewBucket: () => void;
  onDeleteBucket: () => void;
  currentPath: string;
  onNavigatePath: (path: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ExplorerViewMode;
  onViewModeChange: (mode: ExplorerViewMode) => void;
  sortOption: ExplorerSortOption;
  onSortChange: (opt: ExplorerSortOption) => void;
  onRefresh: () => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
  isLoading: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export function BackblazeHeaderBar({
  buckets,
  selectedBucket,
  onSelectBucket,
  onNewBucket,
  onDeleteBucket,
  currentPath,
  onNavigatePath,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  onRefresh,
  onUploadClick,
  onNewFolderClick,
  isLoading,
}: BackblazeHeaderBarProps): React.ReactElement {
  return (
    <div
      className="space-y-2 font-mono text-xs pb-3 border-b"
      style={{ borderColor: 'var(--skipo-border-color)' }}
    >
      {/* Top Row: Bucket Picker & Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-2 py-1 border"
            style={{
              backgroundColor: 'var(--skipo-surface)',
              borderColor: 'var(--skipo-border-color)',
            }}
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold uppercase opacity-70">BUCKET:</span>
            <BrutalistSelect
              value={selectedBucket?.id || ''}
              onChange={(e) => {
                const b = buckets.find((item) => item.id === e.target.value);
                if (b) onSelectBucket(b);
              }}
              inspectionLabel="Selected Bucket"
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-xs"
            >
              {buckets.length === 0 ? (
                <option value="" disabled>No buckets found</option>
              ) : (
                buckets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.type === 'allPublic' ? 'Public' : 'Private'})
                  </option>
                ))
              )}
            </BrutalistSelect>
          </div>

          <BaseIconButton
            tooltip="Create New Bucket"
            icon={<Plus className="w-3.5 h-3.5 text-amber-400" />}
            variant="secondary"
            size="sm"
            onClick={onNewBucket}
          />

          {selectedBucket && (
            <BaseIconButton
              tooltip="Delete Current Bucket"
              icon={<Trash2 className="w-3.5 h-3.5 text-neutral-500 hover:text-rose-400" />}
              variant="ghost"
              size="sm"
              onClick={onDeleteBucket}
            />
          )}

          <div className="flex items-center gap-1">
            <BaseIconButton
              tooltip="Manual Refresh (Instant)"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : 'text-neutral-400 hover:text-amber-300'}`} />}
              variant="ghost"
              size="sm"
              onClick={onRefresh}
            />
            <span
              className="text-[9px] flex items-center gap-1 px-1.5 py-0.5 border rounded-xs uppercase tracking-wider"
              style={{
                backgroundColor: 'var(--skipo-surface)',
                borderColor: 'var(--skipo-border-color)',
              }}
              title="Active interface connection."
            >
              <Radio className="w-2.5 h-2.5 text-emerald-400" />
              <span>ACTIVE</span>
            </span>
          </div>
        </div>

        {/* Right side actions: Upload, New Folder */}
        <div className="flex items-center gap-2">
          <BaseButton
            size="sm"
            variant="secondary"
            onClick={onNewFolderClick}
            className="font-bold flex items-center gap-1.5 text-xs"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW FOLDER</span>
          </BaseButton>

          <BaseButton
            size="sm"
            variant="accent"
            onClick={onUploadClick}
            className="font-bold flex items-center gap-1.5 text-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>UPLOAD FILE</span>
          </BaseButton>
        </div>
      </div>

      {/* Second Row: Breadcrumb Path Navigation */}
      <BackblazeBreadcrumbs
        currentPath={currentPath}
        selectedBucket={selectedBucket}
        onNavigatePath={onNavigatePath}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sortOption={sortOption}
        onSortChange={onSortChange}
      />
    </div>
  );
}
