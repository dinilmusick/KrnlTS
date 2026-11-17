/**
 * @file BackblazeItemList.tsx
 * @description Virtual directory container rendering files and subfolders with drag-and-drop.
 * File size < 200 lines strictly.
 */

import React, { useMemo } from 'react';
import { UploadCloud, FolderOpen } from 'lucide-react';
import { BackblazeItem, ExplorerViewMode, ExplorerSortOption } from './backblazeTypes';
import { BackblazeItemRow } from './BackblazeItemRow';
import { BackblazeGridItem } from './BackblazeGridItem';

interface BackblazeItemListProps {
  items: BackblazeItem[];
  currentPath: string;
  searchQuery: string;
  sortOption: ExplorerSortOption;
  viewMode: ExplorerViewMode;
  isLoading: boolean;
  onOpenFolder: (path: string) => void;
  onPreview: (item: BackblazeItem) => void;
  onInfo: (item: BackblazeItem) => void;
  onDelete: (item: BackblazeItem) => void;
  onFilesDropped: (files: FileList) => void;
}

export function BackblazeItemList({
  items, currentPath, searchQuery, sortOption, viewMode, isLoading,
  onOpenFolder, onPreview, onInfo, onDelete, onFilesDropped,
}: BackblazeItemListProps): React.ReactElement {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const { folders, files, totalSize } = useMemo(() => {
    const normCurrent = currentPath ? currentPath.replace(/\/+$/, '') : '';
    const folderMap = new Map<string, BackblazeItem>();
    const fileList: BackblazeItem[] = [];
    let sizeSum = 0;

    for (const item of items) {
      const itemPath = item.path.replace(/\/+$/, '');
      if (normCurrent) {
        if (!itemPath.startsWith(normCurrent + '/')) continue;
        const relative = itemPath.slice(normCurrent.length + 1);
        const slashIdx = relative.indexOf('/');
        if (slashIdx !== -1) {
          const folderSegment = relative.slice(0, slashIdx);
          const fullFolderPath = `${normCurrent}/${folderSegment}`;
          if (!folderMap.has(folderSegment)) {
            folderMap.set(folderSegment, { id: `folder-${fullFolderPath}`, name: folderSegment, path: fullFolderPath, type: 'folder' });
          }
        } else {
          if (item.name === '.bzEmpty' || relative === '.bzEmpty') continue;
          if (item.type === 'folder') folderMap.set(relative, item);
          else { fileList.push(item); sizeSum += item.sizeBytes || 0; }
        }
      } else {
        const slashIdx = itemPath.indexOf('/');
        if (slashIdx !== -1) {
          const rootFolder = itemPath.slice(0, slashIdx);
          if (!folderMap.has(rootFolder)) {
            folderMap.set(rootFolder, { id: `folder-${rootFolder}`, name: rootFolder, path: rootFolder, type: 'folder' });
          }
        } else {
          if (item.name === '.bzEmpty' || itemPath === '.bzEmpty') continue;
          if (item.type === 'folder') folderMap.set(itemPath, item);
          else { fileList.push(item); sizeSum += item.sizeBytes || 0; }
        }
      }
    }

    let folderArray = Array.from(folderMap.values());
    let filteredFiles = fileList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      folderArray = folderArray.filter((f) => f.name.toLowerCase().includes(q));
      filteredFiles = filteredFiles.filter((f) => f.name.toLowerCase().includes(q));
    }

    const sortFn = (a: BackblazeItem, b: BackblazeItem) => {
      switch (sortOption) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'size_desc': return (b.sizeBytes || 0) - (a.sizeBytes || 0);
        case 'size_asc': return (a.sizeBytes || 0) - (b.sizeBytes || 0);
        case 'date_desc': return (b.uploadTimestamp || 0) - (a.uploadTimestamp || 0);
        case 'date_asc': return (a.uploadTimestamp || 0) - (b.uploadTimestamp || 0);
        default: return 0;
      }
    };

    folderArray.sort(sortFn);
    filteredFiles.sort(sortFn);

    return { folders: folderArray, files: filteredFiles, totalSize: sizeSum };
  }, [items, currentPath, searchQuery, sortOption]);

  const formatTotalSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) onFilesDropped(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      className={`relative min-h-[300px] flex flex-col font-mono text-xs transition-colors ${
        isDragOver ? 'border-2 border-dashed border-amber-400 bg-amber-950/20' : ''
      }`}
    >
      <div className="flex items-center justify-between pb-2 text-[10px] text-neutral-400 border-b border-neutral-800">
        <div>
          <span>{folders.length} {folders.length === 1 ? 'Folder' : 'Folders'}</span>
          <span className="mx-1.5">•</span>
          <span>{files.length} {files.length === 1 ? 'File' : 'Files'}</span>
        </div>
        <div className="text-amber-400/90 font-bold">TOTAL SIZE: {formatTotalSize(totalSize)}</div>
      </div>

      {isLoading && <div className="py-8 text-center text-amber-400 font-bold animate-pulse">Connecting to Backblaze storage...</div>}

      {!isLoading && folders.length === 0 && files.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-neutral-500 border border-dashed border-neutral-800 my-2">
          <FolderOpen className="w-12 h-12 text-neutral-600 mb-2" />
          <span className="font-bold text-neutral-300">Directory is empty</span>
          <span className="text-[11px] mt-1 text-neutral-500">Drag & drop files here or use the Upload button.</span>
        </div>
      )}

      {!isLoading && viewMode === 'list' && (folders.length > 0 || files.length > 0) && (
        <div className="space-y-1 mt-2">
          {folders.map((folder) => <BackblazeItemRow key={folder.id} item={folder} onOpenFolder={onOpenFolder} onDelete={onDelete} />)}
          {files.map((file) => <BackblazeItemRow key={file.id} item={file} onPreview={onPreview} onInfo={onInfo} onDelete={onDelete} />)}
        </div>
      )}

      {!isLoading && viewMode === 'grid' && (folders.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-2">
          {folders.map((folder) => <BackblazeGridItem key={folder.id} item={folder} onOpenFolder={onOpenFolder} onDelete={onDelete} />)}
          {files.map((file) => <BackblazeGridItem key={file.id} item={file} onPreview={onPreview} onInfo={onInfo} onDelete={onDelete} />)}
        </div>
      )}

      {isDragOver && (
        <div className="absolute inset-0 bg-neutral-950/90 border-2 border-dashed border-amber-400 flex flex-col items-center justify-center pointer-events-none z-10">
          <UploadCloud className="w-12 h-12 text-amber-400 animate-bounce mb-2" />
          <span className="text-sm font-bold text-amber-300">DROP FILES TO UPLOAD TO BACKBLAZE</span>
          <span className="text-xs text-neutral-400 mt-1">Files will be placed into /{currentPath}</span>
        </div>
      )}
    </div>
  );
}
