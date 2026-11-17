/**
 * @file ServiceImageContainer.tsx
 * @description In-service Image Container for rendering fetched cloud media from Backblaze B2.
 * Supports image scaling, metadata badges, copy URL, and fallback states.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Image as ImageIcon, ZoomIn, Download, Copy, Check, AlertCircle } from 'lucide-react';

export interface ServiceImageContainerProps {
  src: string;
  alt?: string;
  fileName?: string;
  fileSize?: string;
  dimensions?: string;
  contentType?: string;
  onDownload?: () => void;
  className?: string;
}

export function ServiceImageContainer({
  src,
  alt = 'Fetched Cloud Asset',
  fileName,
  fileSize,
  dimensions,
  contentType,
  onDownload,
  className = '',
}: ServiceImageContainerProps): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`border-2 border-neutral-750 bg-neutral-950 font-mono text-xs shadow-[3px_3px_0px_#000] ${className}`}>
      {/* Header Info Bar */}
      <div className="flex items-center justify-between p-2 border-b border-neutral-800 bg-neutral-900/80">
        <div className="flex items-center gap-2 truncate">
          <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-bold text-neutral-200 truncate text-[11px]">
            {fileName || 'Cloud Image Asset'}
          </span>
          {fileSize && (
            <span className="text-[9px] px-1 bg-neutral-800 border border-neutral-700 text-neutral-400 shrink-0">
              {fileSize}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="p-1 hover:text-amber-400 text-neutral-400 cursor-pointer"
            title="Copy Media URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="p-1 hover:text-amber-400 text-neutral-400 cursor-pointer"
            title={isZoomed ? 'Reset Zoom' : 'Zoom Image'}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="p-1 hover:text-amber-400 text-neutral-400 cursor-pointer"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Image Preview Canvas */}
      <div className="p-3 flex items-center justify-center bg-neutral-900/30 min-h-[180px] overflow-hidden relative">
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-4 text-neutral-500 gap-1 text-[11px]">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Failed to load media payload</span>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            referrerPolicy="no-referrer"
            className={`max-h-64 object-contain transition-transform duration-200 ${
              isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed((prev) => !prev)}
          />
        )}
      </div>

      {/* Footer Meta Ribbon */}
      {(dimensions || contentType) && (
        <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-neutral-500 border-t border-neutral-850 bg-neutral-950">
          <span>{contentType || 'image/*'}</span>
          <span>{dimensions || 'Dynamic Frame'}</span>
        </div>
      )}
    </div>
  );
}
