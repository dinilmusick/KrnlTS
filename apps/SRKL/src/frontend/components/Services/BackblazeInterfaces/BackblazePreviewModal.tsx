import { luthFetch } from '../../../auth/luthAuthClient';
/**
 * @file BackblazePreviewModal.tsx
 * @description Inspector and live media/code previewer for real Backblaze B2 assets.
 * File size < 200 lines strictly.
 */

import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Music, Video, Image as ImageIcon, Eye } from 'lucide-react';
import { BaseIconButton } from '../../common/BaseIconButton';
import { BackblazeItem } from './backblazeTypes';

interface BackblazePreviewModalProps {
  item: BackblazeItem | null;
  onClose: () => void;
}

export function BackblazePreviewModal({ item, onClose }: BackblazePreviewModalProps): React.ReactElement | null {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!item) {
      setTextContent(null);
      return;
    }
    const ct = (item.contentType || '').toLowerCase();
    const isText = ct.startsWith('text/') || ct.includes('json') || ct.includes('javascript') || ct.includes('xml') || item.name.endsWith('.txt') || item.name.endsWith('.json') || item.name.endsWith('.md') || item.name.endsWith('.log') || item.name.endsWith('.env');

    if (isText && (item.previewUrl || item.downloadUrl)) {
      setLoadingText(true);
      luthFetch(item.previewUrl || item.downloadUrl!)
        .then((res) => (res.ok ? res.text() : Promise.reject('Failed to load text')))
        .then((text) => setTextContent(text.slice(0, 10000)))
        .catch(() => setTextContent(null))
        .finally(() => setLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [item]);

  if (!item) return null;

  const streamUrl = item.previewUrl || item.downloadUrl || item.blobUrl;
  const ct = (item.contentType || '').toLowerCase();
  const isImage = ct.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(item.name);
  const isAudio = ct.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(item.name);
  const isVideo = ct.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(item.name);

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="w-full max-w-2xl bg-neutral-900 border-2 border-amber-500 shadow-[4px_4px_0px_#000] p-4 space-y-3 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden text-amber-400 font-bold text-xs">
            <Eye className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {streamUrl && (
              <a
                href={streamUrl}
                download={item.name}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" /> DOWNLOAD
              </a>
            )}
            <BaseIconButton tooltip="Close Preview" icon={<X className="w-4 h-4" />} variant="ghost" size="sm" onClick={onClose} />
          </div>
        </div>

        <div className="text-[11px] text-neutral-300 grid grid-cols-3 gap-2 p-2 bg-neutral-950 border border-neutral-800 shrink-0">
          <div><span className="text-neutral-500 font-bold">Path:</span> <span className="text-neutral-200 truncate block">{item.path}</span></div>
          <div><span className="text-neutral-500 font-bold">Size:</span> <span className="text-neutral-200">{formatBytes(item.sizeBytes)}</span></div>
          <div><span className="text-neutral-500 font-bold">MIME:</span> <span className="text-neutral-200 truncate block">{item.contentType || 'unknown'}</span></div>
        </div>

        <div className="flex-1 overflow-auto bg-neutral-950 border border-neutral-800 p-2 min-h-[220px] flex items-center justify-center">
          {isImage && streamUrl && (
            <img src={streamUrl} alt={item.name} className="max-h-[50vh] max-w-full object-contain mx-auto border border-neutral-800" />
          )}

          {isAudio && streamUrl && (
            <div className="w-full max-w-md p-4 bg-neutral-900 border border-neutral-700 text-center space-y-3">
              <Music className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
              <div className="text-xs font-bold text-neutral-200 truncate">{item.name}</div>
              <audio controls src={streamUrl} className="w-full" autoPlay={false} />
            </div>
          )}

          {isVideo && streamUrl && (
            <div className="w-full flex justify-center">
              <video controls src={streamUrl} className="max-h-[50vh] max-w-full border border-neutral-800" />
            </div>
          )}

          {textContent !== null && (
            <div className="w-full h-full text-left">
              {loadingText ? (
                <div className="text-xs text-neutral-500 py-8 text-center">Loading contents...</div>
              ) : (
                <pre className="text-[11px] font-mono text-neutral-200 whitespace-pre-wrap break-all p-2 overflow-auto max-h-[50vh] bg-neutral-900 border border-neutral-800">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {!isImage && !isAudio && !isVideo && textContent === null && (
            <div className="text-center py-8 space-y-2">
              <FileText className="w-12 h-12 text-neutral-600 mx-auto" />
              <div className="text-xs text-neutral-400">Binary or Unsupported Inline Preview</div>
              <div className="text-[11px] text-neutral-500">Download the file directly to view locally on your device.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
