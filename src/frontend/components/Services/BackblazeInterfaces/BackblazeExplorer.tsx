'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { BackblazeHeaderBar } from './BackblazeHeaderBar';
import { BackblazeItemList } from './BackblazeItemList';
import { BackblazeModalsContainer } from './BackblazeModalsContainer';
import { useBackblazeExplorer } from './useBackblazeExplorer';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface BackblazeExplorerProps {
  account: ServiceAccount;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export function BackblazeExplorer({ account }: BackblazeExplorerProps): React.ReactElement {
  const {
    creds,
    buckets,
    setBuckets,
    selectedBucket,
    setSelectedBucket,
    items,
    currentPath,
    setCurrentPath,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortOption,
    setSortOption,
    isLoading,
    error,
    previewItem,
    setPreviewItem,
    infoItem,
    setInfoItem,
    isCreateBucketOpen,
    setIsCreateBucketOpen,
    isNewFolderOpen,
    setIsNewFolderOpen,
    deleteModalItem,
    setDeleteModalItem,
    isDeletingItem,
    fileInputRef,
    loadBuckets,
    loadBucketFiles,
    handleUploadFiles,
    handleCreateFolder,
    handleConfirmDelete,
    handleDeleteBucket,
  } = useBackblazeExplorer(account);

  return (
    <div className="space-y-3 font-mono text-xs">
      <BaseInput
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
      />

      {error && (
        <div
          className="p-2.5 border-2 flex items-center justify-between gap-2"
          style={{
            backgroundColor: 'var(--skipo-surface)',
            borderColor: 'var(--skipo-border-color)',
            boxShadow: 'var(--skipo-shadow)',
          }}
        >
          <div className="flex items-center gap-2 overflow-hidden text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <BaseButton
            size="sm"
            variant="danger"
            onClick={() => (selectedBucket ? loadBucketFiles() : loadBuckets())}
            className="text-[10px] font-bold uppercase shrink-0 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </BaseButton>
        </div>
      )}

      <div
        className="p-3 border-2 space-y-3"
        style={{
          backgroundColor: 'var(--skipo-surface)',
          borderColor: 'var(--skipo-border-color)',
          boxShadow: 'var(--skipo-shadow)',
        }}
      >
        <BackblazeHeaderBar
          buckets={buckets}
          selectedBucket={selectedBucket}
          onSelectBucket={setSelectedBucket}
          onNewBucket={() => setIsCreateBucketOpen(true)}
          onDeleteBucket={handleDeleteBucket}
          currentPath={currentPath}
          onNavigatePath={setCurrentPath}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOption={sortOption}
          onSortChange={setSortOption}
          onRefresh={() => (selectedBucket ? loadBucketFiles() : loadBuckets())}
          onUploadClick={() => fileInputRef.current?.click()}
          onNewFolderClick={() => setIsNewFolderOpen(true)}
          isLoading={isLoading}
        />

        <BackblazeItemList
          items={items}
          currentPath={currentPath}
          searchQuery={searchQuery}
          sortOption={sortOption}
          viewMode={viewMode}
          isLoading={isLoading}
          onOpenFolder={setCurrentPath}
          onPreview={setPreviewItem}
          onInfo={setInfoItem}
          onDelete={setDeleteModalItem}
          onFilesDropped={handleUploadFiles}
        />
      </div>

      <BackblazeModalsContainer
        previewItem={previewItem}
        onClosePreview={() => setPreviewItem(null)}
        infoItem={infoItem}
        onCloseInfo={() => setInfoItem(null)}
        isCreateBucketOpen={isCreateBucketOpen}
        onCloseCreateBucket={() => setIsCreateBucketOpen(false)}
        creds={creds}
        onBucketCreated={(b) => {
          setBuckets((prev) => [...prev, b]);
          setSelectedBucket(b);
        }}
        isNewFolderOpen={isNewFolderOpen}
        onCloseNewFolder={() => setIsNewFolderOpen(false)}
        currentPath={currentPath}
        onCreateFolder={handleCreateFolder}
        deleteModalItem={deleteModalItem}
        isDeletingItem={isDeletingItem}
        onConfirmDelete={handleConfirmDelete}
        onCloseDeleteModal={() => setDeleteModalItem(null)}
      />
    </div>
  );
}
