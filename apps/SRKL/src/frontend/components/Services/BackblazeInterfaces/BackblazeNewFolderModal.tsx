/**
 * @file BackblazeNewFolderModal.tsx
 * @description Dialog to create a virtual directory/folder inside Backblaze bucket.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { FolderPlus, X, AlertCircle } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { BaseIconButton } from '../../common/BaseIconButton';

interface BackblazeNewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onCreateFolder: (folderName: string) => void;
}

export function BackblazeNewFolderModal({
  isOpen,
  onClose,
  currentPath,
  onCreateFolder,
}: BackblazeNewFolderModalProps): React.ReactElement | null {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = folderName.trim().replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
    if (!clean) {
      setError('Folder name cannot be empty');
      return;
    }
    onCreateFolder(clean);
    setFolderName('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="w-full max-w-sm bg-neutral-900 border-2 border-amber-500 shadow-[4px_4px_0px_#000] p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <FolderPlus className="w-4 h-4" />
            <span>NEW DIRECTORY</span>
          </div>
          <BaseIconButton tooltip="Close" icon={<X className="w-3.5 h-3.5" />} variant="ghost" size="sm" onClick={onClose} />
        </div>

        {error && (
          <div className="p-2 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <span className="text-[10px] text-neutral-500 block mb-1">
              CURRENT LOCATION: <span className="text-neutral-300">/{currentPath ? `${currentPath}/` : ''}</span>
            </span>
            <label className="block text-neutral-300 font-bold mb-1">
              FOLDER NAME <span className="text-amber-500">*</span>
            </label>
            <BaseInput
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. assets, logs, backups"
              className="w-full font-mono"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <BaseButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="font-bold"
            >
              CANCEL
            </BaseButton>
            <BaseButton
              type="submit"
              size="sm"
              variant="accent"
              className="font-bold flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5 mr-1" />
              CREATE
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
