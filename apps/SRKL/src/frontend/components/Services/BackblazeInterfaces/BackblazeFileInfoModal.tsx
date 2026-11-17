/**
 * @file BackblazeFileInfoModal.tsx
 * @description Detailed metadata inspector and checksum viewer for Backblaze files.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Info, X, Copy, Check, Download } from 'lucide-react';
import { BaseButton } from '@skipo/ui';
import { BaseIconButton } from '../../common/BaseIconButton';
import { BackblazeItem } from './backblazeTypes';

interface BackblazeFileInfoModalProps {
  item: BackblazeItem | null;
  onClose: () => void;
}

export function BackblazeFileInfoModal({ item, onClose }: BackblazeFileInfoModalProps): React.ReactElement | null {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!item) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '--';
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB (${bytes.toLocaleString()} bytes)`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${bytes.toLocaleString()} bytes)`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="w-full max-w-lg bg-neutral-900 border-2 border-amber-500 shadow-[4px_4px_0px_#000] p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Info className="w-4 h-4" />
            <span>BACKBLAZE OBJECT METADATA</span>
          </div>
          <BaseIconButton tooltip="Close" icon={<X className="w-3.5 h-3.5" />} variant="ghost" size="sm" onClick={onClose} />
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2 bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">File Name & Path</span>
            <span className="text-neutral-100 font-bold break-all">{item.path}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-neutral-950 border border-neutral-800 space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Size</span>
              <span className="text-neutral-200">{formatBytes(item.sizeBytes)}</span>
            </div>
            <div className="p-2 bg-neutral-950 border border-neutral-800 space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Content-Type</span>
              <span className="text-neutral-200">{item.contentType || 'application/octet-stream'}</span>
            </div>
          </div>

          {item.fileId && (
            <div className="p-2 bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2">
              <div className="overflow-hidden">
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">B2 File ID</span>
                <span className="text-amber-300 font-mono text-[11px] truncate block">{item.fileId}</span>
              </div>
              <BaseIconButton
                tooltip="Copy File ID"
                icon={copiedKey === 'fileId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                size="sm"
                variant="ghost"
                onClick={() => handleCopy('fileId', item.fileId!)}
              />
            </div>
          )}

          {item.sha1 && (
            <div className="p-2 bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2">
              <div className="overflow-hidden">
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">SHA-1 Checksum</span>
                <span className="text-emerald-400 font-mono text-[11px] truncate block">{item.sha1}</span>
              </div>
              <BaseIconButton
                tooltip="Copy SHA-1"
                icon={copiedKey === 'sha1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                size="sm"
                variant="ghost"
                onClick={() => handleCopy('sha1', item.sha1!)}
              />
            </div>
          )}

          {item.updatedAt && (
            <div className="p-2 bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Upload Timestamp</span>
              <span className="text-neutral-300">{item.updatedAt}</span>
            </div>
          )}

          {item.downloadUrl && (
            <div className="p-2 bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Download / Stream Link</span>
                <BaseButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy('downloadUrl', item.downloadUrl!)}
                  className="text-[10px] text-amber-400"
                >
                  {copiedKey === 'downloadUrl' ? 'Copied Link!' : 'Copy Link'}
                </BaseButton>
              </div>
              <div className="flex gap-2">
                <a
                  href={item.previewUrl || item.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={item.name}
                  className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-1 text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <BaseButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="font-bold"
          >
            CLOSE
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
