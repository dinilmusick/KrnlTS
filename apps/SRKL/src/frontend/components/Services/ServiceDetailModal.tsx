/**
 * @file ServiceDetailModal.tsx
 * @description Modal showing comprehensive service definition and contracts.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { X, ShieldCheck, ExternalLink } from 'lucide-react';
import { BaseButton } from '@skipo/ui';
import { BaseIconButton } from '../common/BaseIconButton';
import { ServiceDefinition } from '@/libraries/types/srkl';

interface ServiceDetailModalProps {
  definition: ServiceDefinition | null;
  onClose: () => void;
}

export function ServiceDetailModal({ definition, onClose }: ServiceDetailModalProps): React.ReactElement | null {
  const [subTab, setSubTab] = useState<'OVERVIEW' | 'ENDPOINTS' | 'ACTIONS' | 'JSON'>('OVERVIEW');

  if (!definition) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="w-full max-w-3xl max-h-[85vh] bg-neutral-900 border border-neutral-700 shadow-2xl rounded-sm flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-100">{definition.name}</h2>
              <span className="text-xs px-2 py-0.5 border border-amber-800 bg-amber-950/40 text-amber-400 rounded-sm">
                v{definition.version}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{definition.identifier}</p>
          </div>
          <BaseIconButton tooltip="Close" icon={<X className="w-5 h-5" />} onClick={onClose} variant="ghost" size="sm" />
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/60 text-xs px-4 gap-1 py-1">
          {(['OVERVIEW', 'ENDPOINTS', 'ACTIONS', 'JSON'] as const).map((tab) => (
            <BaseButton
              key={tab}
              type="button"
              size="sm"
              variant={subTab === tab ? 'accent' : 'ghost'}
              onClick={() => setSubTab(tab)}
              className="py-1 px-3 text-xs"
            >
              {tab}
            </BaseButton>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {subTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div>
                <span className="text-neutral-400 uppercase text-[10px] block mb-1">Description</span>
                <p className="text-neutral-200 text-sm leading-relaxed">{definition.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 border border-neutral-800 bg-neutral-950 rounded-sm">
                  <span className="text-neutral-400 uppercase text-[10px] block mb-1">Auth Type</span>
                  <div className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4" /> {definition.authType}
                  </div>
                </div>
                <div className="p-3 border border-neutral-800 bg-neutral-950 rounded-sm">
                  <span className="text-neutral-400 uppercase text-[10px] block mb-1">Telemetry Polling</span>
                  <div className="text-neutral-200 font-semibold">{definition.pollingIntervalSeconds}s Cadence</div>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-neutral-400 uppercase text-[10px] block mb-2">Required Credentials</span>
                <div className="space-y-2">
                  {definition.credentialFields.map((f) => (
                    <div key={f.name} className="p-2.5 border border-neutral-800 bg-neutral-950/60 rounded-sm flex justify-between items-center gap-2">
                      <div>
                        <div className="font-semibold text-neutral-200 flex items-center gap-2">
                          <span>{f.label || f.name}</span>
                          {f.required && (
                            <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold uppercase">MANDATORY</span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400">{f.description}</div>
                        {f.guideUrl && (
                          <a
                            href={f.guideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 mt-1 font-semibold"
                          >
                            <span>Get Value / Webpage Guide</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 border rounded flex-shrink-0 ${f.secret ? 'border-amber-800 text-amber-400' : 'border-neutral-700 text-neutral-400'}`}>
                        {f.secret ? 'SECRET (PROTECTED)' : 'PUBLIC PARAM'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {subTab === 'ENDPOINTS' && (
            <div className="space-y-2">
              {definition.endpoints.map((ep) => (
                <div key={ep.path} className="p-3 border border-neutral-800 bg-neutral-950 rounded-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold border border-sky-800 bg-sky-950/60 text-sky-400 rounded-sm">
                      {ep.method}
                    </span>
                    <span className="text-neutral-200 font-semibold">{ep.name}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">{ep.path}</div>
                  <div className="text-[11px] text-neutral-400">{ep.description}</div>
                </div>
              ))}
            </div>
          )}

          {subTab === 'ACTIONS' && (
            <div className="space-y-2">
              {definition.actions.map((act) => (
                <div key={act.id} className="p-3 border border-neutral-800 bg-neutral-950 rounded-sm flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-neutral-200">{act.name}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">{act.id} • {act.description}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 border rounded-sm font-semibold ${act.destructive ? 'border-rose-800 text-rose-400' : 'border-neutral-700 text-neutral-300'}`}>
                    {act.actionType}
                  </span>
                </div>
              ))}
            </div>
          )}

          {subTab === 'JSON' && (
            <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm text-[11px] text-amber-300/90 overflow-x-auto">
              {JSON.stringify(definition, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
