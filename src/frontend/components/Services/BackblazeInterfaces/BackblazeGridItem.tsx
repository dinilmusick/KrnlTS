/**
 * @file BackblazeGridItem.tsx
 * @description Grid tile item for Backblaze B2 Directory Explorer with visual previews.
 * File size < 200 lines strictly.
 */

import React from 'react';
import {
  Folder,
  File,
  FileCode,
  FileText,
  FileArchive,
  Image as ImageIcon,
  Music,
  Video,
  Eye,
  Download,
  Info,
  Trash2,
} from 'lucide-react';
import { BaseIconButton } from '../../common/BaseIconButton';
import { BackblazeItem } from './backblazeTypes';

export interface BackblazeGridItemProps {
  item: BackblazeItem;
  onOpenFolder?: (path: string) => void;
  onPreview?: (item: BackblazeItem) => void;
  onInfo?: (item: BackblazeItem) => void;
  onDelete?: (item: BackblazeItem) => void;
}

export function BackblazeGridItem({
  item,
  onOpenFolder,
  onPreview,
  onInfo,
  onDelete,
}: BackblazeGridItemProps): React.ReactElement {
  const isFolder = item.type === 'folder';
  const ct = (item.contentType || '').toLowerCase();
  const name = item.name.toLowerCase();
  const isImage = ct.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|ico)$/.test(name);
  const isAudio = ct.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/.test(name);
  const isVideo = ct.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/.test(name);
  const isCode = /\.(ts|tsx|js|jsx|json|html|css|py|rs|go|sh)$/.test(name);
  const isArchive = /\.(zip|tar|gz|rar|7z|bz2)$/.test(name);

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return isFolder ? 'DIR' : '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const previewSource = item.previewUrl || item.downloadUrl || item.blobUrl;

  return (
    <div
      className={`group relative flex flex-col justify-between p-3 border border-neutral-800 bg-neutral-950/80 hover:bg-neutral-900 transition-all font-mono text-xs ${
        isFolder ? 'cursor-pointer hover:border-amber-400/60' : 'hover:border-neutral-700'
      }`}
      onClick={() => {
        if (isFolder) onOpenFolder?.(item.path);
        else onPreview?.(item);
      }}
    >
      <div className="h-24 w-full flex items-center justify-center bg-neutral-900/60 border border-neutral-800/80 mb-2 overflow-hidden relative">
        {isFolder && (
          <div className="text-center space-y-1">
            <Folder className="w-10 h-10 text-amber-400 fill-amber-400/20 mx-auto" />
            <span className="text-[10px] text-amber-300 font-bold uppercase">Folder</span>
          </div>
        )}

        {!isFolder && isImage && previewSource && (
          <img src={previewSource} alt={item.name} className="w-full h-full object-cover" />
        )}

        {!isFolder && isImage && !previewSource && (
          <ImageIcon className="w-8 h-8 text-emerald-400" />
        )}

        {!isFolder && isAudio && (
          <div className="text-center space-y-1">
            <Music className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
            <span className="text-[9px] text-indigo-300 font-bold uppercase">Audio</span>
          </div>
        )}

        {!isFolder && isVideo && (
          <div className="text-center space-y-1">
            <Video className="w-8 h-8 text-purple-400 mx-auto" />
            <span className="text-[9px] text-purple-300 font-bold uppercase">Video</span>
          </div>
        )}

        {!isFolder && isArchive && (
          <div className="text-center space-y-1">
            <FileArchive className="w-8 h-8 text-amber-500 mx-auto" />
            <span className="text-[9px] text-amber-400 font-bold uppercase">Archive</span>
          </div>
        )}

        {!isFolder && isCode && (
          <div className="text-center space-y-1">
            <FileCode className="w-8 h-8 text-cyan-400 mx-auto" />
            <span className="text-[9px] text-cyan-300 font-bold uppercase">Source Code</span>
          </div>
        )}

        {!isFolder && !isImage && !isAudio && !isVideo && !isArchive && !isCode && (
          <div className="text-center space-y-1">
            <FileText className="w-8 h-8 text-neutral-400 mx-auto" />
            <span className="text-[9px] text-neutral-400 uppercase">Document</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div
          className={`font-bold truncate text-[11px] ${
            isFolder ? 'text-amber-300' : 'text-neutral-200'
          }`}
          title={item.name}
        >
          {item.name}
        </div>
        <div className="flex items-center justify-between text-[10px] text-neutral-500">
          <span>{formatBytes(item.sizeBytes)}</span>
          <span className="truncate max-w-[80px]">{isFolder ? 'Dir' : item.contentType?.split('/')[1] || 'raw'}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 pt-2 mt-2 border-t border-neutral-800/80 opacity-75 group-hover:opacity-100">
        {!isFolder && onPreview && (
          <BaseIconButton
            tooltip="Preview"
            icon={<Eye className="w-3.5 h-3.5" />}
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(item);
            }}
          />
        )}

        {!isFolder && item.downloadUrl && (
          <a
            href={item.previewUrl || item.downloadUrl}
            download={item.name}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-neutral-400 hover:text-amber-400"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        )}

        {!isFolder && onInfo && (
          <BaseIconButton
            tooltip="Metadata"
            icon={<Info className="w-3.5 h-3.5" />}
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onInfo(item);
            }}
          />
        )}

        {onDelete && (
          <BaseIconButton
            tooltip="Delete"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          />
        )}
      </div>
    </div>
  );
}
