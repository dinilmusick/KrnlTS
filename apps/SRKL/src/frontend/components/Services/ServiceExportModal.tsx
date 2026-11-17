/**
 * @file ServiceExportModal.tsx
 * @description Export dialog inheriting from BaseModal rendering complete JSON bundle.
 * Uses BaseIconButton for copy, download, and close actions.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Copy, Check, Download, FileJson, X } from 'lucide-react';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceDefinition } from '@/libraries/types/srkl';
import { exportBundleToJsonString } from './serviceBundleHelper';
import { BaseModal } from '../common/BaseModal';
import { BaseIconButton } from '../common/BaseIconButton';

interface ServiceExportModalProps {
  account: ServiceAccount | null;
  definition?: ServiceDefinition;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceExportModal({
  account,
  definition,
  isOpen,
  onClose,
}: ServiceExportModalProps): React.ReactElement | null {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !account) return null;

  const fallbackDef: ServiceDefinition = definition || {
    identifier: account.serviceId,
    name: account.name,
    description: (account.metadata?.description as string) || '',
    version: '1.0.0',
    authType: 'API_KEY',
    credentialFields: [],
    endpoints: [],
    actions: [],
    resources: [],
    pollingIntervalSeconds: 60,
    metadata: {},
  };

  const jsonString = exportBundleToJsonString(account, fallbackDef);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${account.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-service.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`EXPORT SERVICE: ${account.name}`}
      subtitle="Symmetric Bundle (Export JSON = Import JSON)"
      icon={<FileJson className="w-4 h-4 text-amber-400" />}
      maxWidth="2xl"
    >
      {/* JSON Code Viewer */}
      <div className="relative">
        <pre className="w-full p-3.5 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-amber-200/90 font-mono max-h-[320px] overflow-auto leading-relaxed select-all">
          {jsonString}
        </pre>
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <BaseIconButton
            tooltip={copied ? 'Copied to Clipboard!' : 'Copy JSON to Clipboard'}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            variant="surface"
            size="sm"
            onClick={handleCopy}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
        <span className="text-[10px] text-neutral-500 font-mono">
          Ready for one-click re-import via the Add Service (+) Tile
        </span>
        <div className="flex items-center gap-2">
          <BaseIconButton
            tooltip="Close Dialog"
            icon={<X className="w-4 h-4" />}
            variant="secondary"
            size="md"
            onClick={onClose}
          />
          <BaseIconButton
            tooltip="Download .json File"
            icon={<Download className="w-4 h-4" />}
            variant="primary"
            size="md"
            onClick={handleDownload}
          />
        </div>
      </div>
    </BaseModal>
  );
}
