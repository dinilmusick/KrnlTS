/**
 * @file GoogleAiStudioAppCard.tsx
 * @description Card renderer for an individual Google AI Studio developing applet.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Trash2, Smartphone, Globe, Cpu, Server } from 'lucide-react';
import { BaseIconButton } from '../../common/BaseIconButton';
import { AiStudioApp } from '@/libraries/types/aiStudio';

interface GoogleAiStudioAppCardProps {
  app: AiStudioApp;
  onDelete: (id: string) => void;
}

export function GoogleAiStudioAppCard({ app, onDelete }: GoogleAiStudioAppCardProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(app.appletId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const getPlatformIcon = () => {
    if (app.platform.includes('Android')) return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
    if (app.platform.includes('Cloud Run')) return <Server className="w-3.5 h-3.5 text-sky-400" />;
    if (app.platform.includes('Tuned')) return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
    return <Globe className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <div className="p-3 border-2 border-neutral-800 bg-neutral-950 hover:border-amber-500/50 transition-colors space-y-2 relative">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-neutral-900 border border-neutral-800">{getPlatformIcon()}</div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-neutral-100 text-xs">{app.name}</span>
              {app.isCurrentWorkspace && (
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase">
                  ACTIVE APPLET
                </span>
              )}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-1.5">
              <span>ID: {app.appletId.slice(0, 16)}...</span>
              <BaseIconButton
                tooltip="Copy Applet ID"
                icon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                size="sm"
                variant="ghost"
                onClick={handleCopyId}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span
            className={`text-[9px] px-1.5 py-0.5 border font-bold uppercase ${
              app.status === 'DEPLOYED'
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                : app.status === 'STAGING'
                ? 'border-sky-500/40 bg-sky-950/40 text-sky-300'
                : 'border-amber-500/40 bg-amber-950/40 text-amber-300'
            }`}
          >
            {app.status}
          </span>
          {!app.isCurrentWorkspace && (
            <BaseIconButton
              tooltip="Remove Applet"
              icon={<Trash2 className="w-3 h-3" />}
              size="sm"
              variant="danger"
              onClick={() => onDelete(app.id)}
            />
          )}
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{app.description}</p>

      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-neutral-900 text-neutral-400 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold">
            {app.model}
          </span>
          <span className="text-neutral-500">Project: {app.projectId}</span>
        </div>

        {(app.shareUrl || app.devUrl) && (
          <a
            href={app.shareUrl || app.devUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold uppercase underline"
          >
            <span>Preview</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
