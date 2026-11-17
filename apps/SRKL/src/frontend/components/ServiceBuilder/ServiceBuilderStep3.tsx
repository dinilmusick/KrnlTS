/**
 * @file ServiceBuilderStep3.tsx
 * @description Service Builder Step 3: Resources, Surveillance & Final JSON Export.
 * Adheres strictly to BaseIconButton icon-only button protocol.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { BaseInput } from '@skipo/ui';
import { Plus, Trash2, Download, Copy, Check, CheckCircle2, Box, Sparkles } from 'lucide-react';
import { ResourceDefinition, ServiceDefinition } from '@/libraries/types/srkl';
import { BaseIconButton } from '../common/BaseIconButton';

interface Step3Props {
  resources: ResourceDefinition[];
  setResources: React.Dispatch<React.SetStateAction<ResourceDefinition[]>>;
  pollingInterval: number;
  setPollingInterval: (v: number) => void;
  fullDefinition: ServiceDefinition;
  onRegisterService: () => void;
}

export function ServiceBuilderStep3({
  resources,
  setResources,
  pollingInterval,
  setPollingInterval,
  fullDefinition,
  onRegisterService,
}: Step3Props): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const addResource = () => {
    setResources((prev) => [
      ...prev,
      {
        type: `res_type_${prev.length + 1}`,
        name: `Resource ${prev.length + 1}`,
        description: 'Resource entity managed by this service',
        supportedActions: ['READ', 'DELETE'],
        hasChildren: false,
      },
    ]);
  };

  const removeResource = (i: number) => {
    setResources((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fullDefinition, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(fullDefinition, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fullDefinition.identifier}-service.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegister = () => {
    onRegisterService();
    setRegisteredSuccess(true);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Resources & Hierarchy */}
      <div className="p-3 border border-neutral-800 bg-neutral-950/60 space-y-3 shadow-[2px_2px_0px_#000]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase text-neutral-200">4. Resource Models</h3>
          </div>
          <BaseIconButton
            tooltip="Add Resource Model Definition"
            icon={<Plus className="w-3.5 h-3.5" />}
            variant="primary"
            size="sm"
            onClick={addResource}
          />
        </div>

        <div className="space-y-2">
          {resources.map((r, i) => (
            <div key={i} className="p-2 border border-neutral-800 bg-neutral-900 space-y-2">
              <div className="flex items-center gap-2">
                <BaseInput type="text" placeholder="Type identifier (e.g. table)"
                  value={r.type}
                  onChange={(e) => {
                    const val = e.target.value;
                    setResources((prev) => prev.map((item, idx) => (idx === i ? { ...item, type: val } : item)));
                  }}
                  className="w-1/3" />
                <BaseInput type="text" placeholder="Display name"
                  value={r.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setResources((prev) => prev.map((item, idx) => (idx === i ? { ...item, name: val } : item)));
                  }}
                  className="flex-1" />
                <BaseIconButton
                  tooltip="Remove Resource Model"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  variant="danger"
                  size="sm"
                  onClick={() => removeResource(i)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Surveillance & Polling */}
      <div className="p-3 border border-neutral-800 bg-neutral-950/60 space-y-2 shadow-[2px_2px_0px_#000]">
        <h3 className="text-xs font-bold uppercase text-neutral-200">5. Surveillance Configuration</h3>
        <div className="flex items-center gap-3">
          <label className="text-neutral-400">Polling Interval (seconds):</label>
          <BaseInput type="number" min={10}
            max={3600}
            value={pollingInterval}
            onChange={(e) => setPollingInterval(Number(e.target.value))}
            className="w-24" />
        </div>
      </div>

      {/* Output & Export */}
      <div className="p-3 border border-neutral-800 bg-neutral-950/60 space-y-3 shadow-[2px_2px_0px_#000]">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase text-neutral-200">6. JSON Service Contract</h3>
          <div className="flex items-center gap-2">
            <BaseIconButton
              tooltip={copied ? 'Copied to Clipboard!' : 'Copy JSON Contract'}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              variant="secondary"
              size="sm"
              onClick={handleCopyJson}
            />
            <BaseIconButton
              tooltip="Download JSON Definition"
              icon={<Download className="w-3.5 h-3.5" />}
              variant="secondary"
              size="sm"
              onClick={handleDownload}
            />
          </div>
        </div>

        <pre className="p-3 bg-neutral-950 border border-neutral-800 text-[11px] text-amber-300/90 overflow-x-auto max-h-48">
          {JSON.stringify(fullDefinition, null, 2)}
        </pre>

        {registeredSuccess ? (
          <div className="p-2.5 border border-emerald-800 bg-emerald-950/60 text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Service definition registered into live hub!</span>
          </div>
        ) : (
          <div className="flex justify-end pt-2">
            <BaseIconButton
              tooltip="Register & Instantiate Provider into Hub"
              icon={<Sparkles className="w-4 h-4 text-black" />}
              variant="primary"
              size="lg"
              onClick={handleRegister}
            />
          </div>
        )}
      </div>
    </div>
  );
}
