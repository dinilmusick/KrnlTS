/**
 * @file BackblazeDeleteConfirmModal.tsx
 * @description Confirmation modal for permanent file and folder deletion in Backblaze B2.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { AlertTriangle, Trash2, Folder, File, Loader2, X } from 'lucide-react';
import { BaseButton } from '@skipo/ui';
import { BaseIconButton } from '../../common/BaseIconButton';
import { BackblazeItem } from './backblazeTypes';

interface BackblazeDeleteConfirmModalProps {
  isOpen: boolean;
  item: BackblazeItem | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function BackblazeDeleteConfirmModal({
  isOpen,
  item,
  isDeleting,
  onConfirm,
  onClose,
}: BackblazeDeleteConfirmModalProps): React.ReactElement | null {
  if (!isOpen || !item) return null;

  const isFolder = item.type === 'folder';

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono text-xs">
      <div className="w-full max-w-md bg-neutral-900 border-2 border-rose-800 shadow-[6px_6px_0px_#000] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
              Confirm Permanent Deletion
            </h3>
          </div>
          <BaseIconButton
            tooltip="Close"
            icon={<X className="w-4 h-4" />}
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          />
        </div>

        <div className="p-3 bg-neutral-950 border border-neutral-800 space-y-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-neutral-900 border border-neutral-800 shrink-0">
              {isFolder ? (
                <Folder className="w-6 h-6 text-amber-400 fill-amber-400/20" />
              ) : (
                <File className="w-6 h-6 text-rose-400" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
                  {isFolder ? 'Folder' : 'File'}
                </span>
                <span className="font-bold text-neutral-100 truncate text-xs" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 truncate" title={item.path}>
                Path: /{item.path}
              </div>
              {!isFolder && (
                <div className="text-[10px] text-neutral-500">
                  Size: {formatBytes(item.sizeBytes)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-rose-950/40 border border-rose-900/80 text-[11px] text-rose-200 leading-relaxed">
          {isFolder ? (
            <p>
              Warning: Deleting this folder will <strong className="text-rose-400 font-bold">PERMANENTLY DELETE</strong> all files, subfolders, and historical file versions contained within it in Backblaze B2. This action cannot be undone.
            </p>
          ) : (
            <p>
              Warning: This file and <strong className="text-rose-400 font-bold">ALL of its versions</strong> will be permanently purged from Backblaze B2 storage.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <BaseButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={isDeleting}
            onClick={onClose}
            className="text-xs font-bold uppercase"
          >
            Cancel
          </BaseButton>
          <BaseButton
            type="button"
            size="sm"
            variant="danger"
            disabled={isDeleting}
            onClick={onConfirm}
            className="text-xs font-bold uppercase flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-rose-200" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-300" />
                <span>Permanently Delete</span>
              </>
            )}
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
