/**
 * @file BackblazeItemRow.tsx
 * @description List row item for Backblaze B2 Directory Explorer with file-type icons and actions.
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
import { BackblazeItem } from './backblazeTypes';
import { BaseIconButton } from '../../common/BaseIconButton';

export interface BackblazeItemRowProps {
  item: BackblazeItem;
  onOpenFolder?: (path: string) => void;
  onPreview?: (item: BackblazeItem) => void;
  onInfo?: (item: BackblazeItem) => void;
  onDelete?: (item: BackblazeItem) => void;
}

export function BackblazeItemRow({
  item,
  onOpenFolder,
  onPreview,
  onInfo,
  onDelete,
}: BackblazeItemRowProps): React.ReactElement {
  const isFolder = item.type === 'folder';

  const getIcon = () => {
    if (isFolder) return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />;
    const ct = (item.contentType || '').toLowerCase();
    const name = item.name.toLowerCase();

    if (ct.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|ico)$/.test(name)) {
      return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    }
    if (ct.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/.test(name)) {
      return <Music className="w-4 h-4 text-indigo-400" />;
    }
    if (ct.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/.test(name)) {
      return <Video className="w-4 h-4 text-purple-400" />;
    }
    if (/\.(zip|tar|gz|rar|7z|bz2)$/.test(name)) {
      return <FileArchive className="w-4 h-4 text-amber-500" />;
    }
    if (/\.(ts|tsx|js|jsx|json|html|css|py|rs|go|sh)$/.test(name)) {
      return <FileCode className="w-4 h-4 text-cyan-400" />;
    }
    if (/\.(txt|md|log|csv|pdf|doc|docx)$/.test(name)) {
      return <FileText className="w-4 h-4 text-neutral-300" />;
    }
    return <File className="w-4 h-4 text-neutral-400" />;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return isFolder ? '--' : '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const canPreview = !isFolder;

  return (
    <div
      className={`group flex items-center justify-between p-2 text-xs border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 transition-colors ${
        isFolder ? 'cursor-pointer hover:border-amber-500/50' : ''
      }`}
      onClick={() => isFolder && onOpenFolder?.(item.path)}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="shrink-0">{getIcon()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono truncate font-medium ${
                isFolder ? 'text-amber-300 font-bold hover:underline' : 'text-neutral-200'
              }`}
            >
              {item.name}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-3">
            <span>{isFolder ? 'Folder' : item.contentType || 'binary/octet-stream'}</span>
            {item.updatedAt && <span>{item.updatedAt}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right font-mono text-neutral-400 w-20 text-[11px]">
          {formatBytes(item.sizeBytes)}
        </div>

        <div className="flex items-center gap-1">
          {canPreview && onPreview && (
            <BaseIconButton
              tooltip="Preview Content"
              icon={<Eye className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200" />}
              variant="ghost"
              size="sm"
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
              className="p-1 text-neutral-400 hover:text-amber-400 transition-colors"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}

          {!isFolder && onInfo && (
            <BaseIconButton
              tooltip="File Info & Hashes"
              icon={<Info className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200" />}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onInfo(item);
              }}
            />
          )}

          {onDelete && (
            <BaseIconButton
              tooltip={`Delete ${isFolder ? 'Folder' : 'File'}`}
              icon={<Trash2 className="w-3.5 h-3.5 text-neutral-500 hover:text-rose-400" />}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
