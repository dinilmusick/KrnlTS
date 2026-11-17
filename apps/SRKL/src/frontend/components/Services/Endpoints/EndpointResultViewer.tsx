/**
 * @file EndpointResultViewer.tsx
 * @description Result presentation inspector for endpoint executions.
 * Displays latency, status, headers, and scrollable JSON payload.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Copy, Check, Trash2, Clock, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import { EndpointExecutionResult } from '@/libraries/utils/endpointExecutor';
import { BaseIconButton } from '../../common/BaseIconButton';

interface EndpointResultViewerProps {
  result: EndpointExecutionResult | null;
  isLoading: boolean;
  onClear: () => void;
}

export function EndpointResultViewer({
  result,
  isLoading,
  onClear,
}: EndpointResultViewerProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-950/90 border border-amber-500/50 flex flex-col items-center justify-center space-y-2 text-amber-400 font-mono text-xs">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent animate-spin" />
        <span className="text-[11px] tracking-wider uppercase animate-pulse">
          Dispatching endpoint request...
        </span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 bg-neutral-950/40 border border-dashed border-neutral-800 text-center font-mono text-[11px] text-neutral-500">
        Awaiting endpoint trigger. Click run to execute.
      </div>
    );
  }

  const handleCopy = () => {
    const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccess = result.statusCode >= 200 && result.statusCode < 300;
  const jsonString = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);

  return (
    <div className="p-2.5 bg-neutral-950 border border-neutral-800 space-y-2 font-mono text-xs shadow-inner">
      {/* Status Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold uppercase border flex items-center gap-1 ${
              isSuccess
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                : 'bg-rose-950/60 border-rose-500 text-rose-400'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {result.statusCode} {result.statusText}
          </span>

          <span className="flex items-center gap-1 text-[10px] text-neutral-400">
            <Clock className="w-3 h-3 text-neutral-500" />
            {result.durationMs}ms
          </span>
        </div>

        {/* Action Controls: Strictly BaseIconButton */}
        <div className="flex items-center gap-1">
          <BaseIconButton
            tooltip={copied ? 'Copied to clipboard' : 'Copy Response JSON'}
            icon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            variant="subtle"
            size="sm"
            onClick={handleCopy}
          />
          <BaseIconButton
            tooltip="Clear Result"
            icon={<Trash2 className="w-3 h-3 text-neutral-500 hover:text-rose-400" />}
            variant="subtle"
            size="sm"
            onClick={onClear}
          />
        </div>
      </div>

      {/* URL called */}
      <div className="flex items-center gap-1 text-[10px] text-neutral-400 truncate bg-neutral-900/60 px-2 py-1 border border-neutral-850">
        <Globe className="w-3 h-3 text-neutral-500 shrink-0" />
        <span className="font-bold text-neutral-300 uppercase shrink-0">{result.method}</span>
        <span className="truncate text-neutral-400">{result.url}</span>
      </div>

      {/* JSON Payload viewer */}
      <div className="relative max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-800 p-2 text-[11px] leading-relaxed text-emerald-300 select-text">
        <pre className="whitespace-pre-wrap font-mono break-all">{jsonString}</pre>
      </div>
    </div>
  );
}
