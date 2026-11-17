/**
 * @file ServiceImportTab.tsx
 * @description JSON Import interface ensuring Export JSON == Import JSON fidelity.
 * Adheres to Skipo BaseIconButton protocol with hover tooltips and zero text on buttons.
 * File size < 200 lines strictly.
 */

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Sparkles, X, RefreshCw } from 'lucide-react';
import { parseServiceBundle } from './serviceBundleHelper';
import { ServiceDefinition } from '@/libraries/types/srkl';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { BaseInput, BaseTextarea } from '@skipo/ui';
import { BaseIconButton } from '../common/BaseIconButton';

interface ServiceImportTabProps {
  onImportComplete: (service: ServiceDefinition, account: ServiceAccount) => Promise<void> | void;
  onCancel: () => void;
}

export function ServiceImportTab({
  onImportComplete,
  onCancel,
}: ServiceImportTabProps): React.ReactElement {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<{ service: ServiceDefinition; account: ServiceAccount } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleParse = (raw: string) => {
    setError(null);
    setJsonText(raw);
    if (!raw.trim()) {
      setPreview(null);
      return;
    }
    try {
      const result = parseServiceBundle(raw);
      setPreview(result);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : 'Invalid JSON bundle schema');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    if (!preview || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onImportComplete(preview.service, preview.account);
    } catch (err: any) {
      setError(err.message || 'Unable to save the imported service to this workspace.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative space-y-4 font-mono text-xs">
      {isSubmitting && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-neutral-950 border border-amber-500/80 shadow-xl rounded-xs">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-neutral-100 uppercase tracking-wide block leading-tight">
                Importing Service Bundle...
              </span>
              <span className="text-[9px] text-neutral-400 block leading-tight">
                Registering definition & linking service account
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-neutral-400 text-[11px]">
          Upload or paste an exported service bundle
        </span>
        <BaseIconButton
          tooltip="Upload .json file from disk"
          icon={<Upload className="w-4 h-4 text-amber-400" />}
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        />
        <BaseInput
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="relative">
        <BaseTextarea
          value={jsonText}
          onChange={(e) => handleParse(e.target.value)}
          placeholder={`Paste JSON here...\n{\n  "format": "srkl-service-bundle-v1",\n  "service": { ... },\n  "account": { ... }\n}`}
          rows={7}
          className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-none text-neutral-200 font-mono text-[11px] focus:outline-none focus:border-amber-500/80 resize-none leading-relaxed"
        />
      </div>

      {error && (
        <div className="p-2.5 border border-rose-900/80 bg-rose-950/30 text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">{error}</div>
        </div>
      )}

      {preview && (
        <div className="p-2.5 border border-emerald-800/80 bg-emerald-950/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>VALID SERVICE BUNDLE RECOGNIZED</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-neutral-300">
            <div>
              <span className="text-neutral-500 block text-[9px] uppercase">SERVICE:</span>
              <span className="font-bold text-amber-300">{preview.service.name}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[9px] uppercase">TILE NAME:</span>
              <span className="font-bold text-neutral-100">{preview.account.name}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[9px] uppercase">CREDENTIALS:</span>
              <span className="font-bold text-emerald-300">
                {Object.keys(preview.account.getAllCredentials()).length} secrets
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons: strictly BaseIconButton with tooltips */}
      <div className="flex justify-end items-center gap-2 pt-3 border-t border-neutral-800">
        <BaseIconButton
          tooltip="Cancel & Discard"
          icon={<X className="w-4 h-4" />}
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={isSubmitting}
        />
        <BaseIconButton
          tooltip={isSubmitting ? 'Importing...' : preview ? 'Confirm & Instantiate Service Tile' : 'Provide a valid JSON bundle first'}
          icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Sparkles className="w-4 h-4 text-black" />}
          variant="primary"
          size="md"
          disabled={!preview || isSubmitting}
          onClick={handleConfirm}
        />
      </div>
    </div>
  );
}
