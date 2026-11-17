import { luthFetch } from '../../../auth/luthAuthClient';
/**
 * @file CloudflareWorkersExplorer.tsx
 * @description Dedicated interactive Cloudflare Workers & Pages Projects Explorer.
 * File size < 200 lines strictly.
 */

import React, { useState, useEffect } from 'react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ExternalLink, RefreshCw, Globe, CheckCircle, Search, Cpu, AppWindow, Database, AlertCircle } from 'lucide-react';

interface CloudflareResource {
  id: string;
  type: string;
  name: string;
  url?: string;
  status: string;
  updatedAt?: string;
  routes?: string[];
  subdomain?: string;
  meta?: Record<string, unknown>;
}

interface CloudflareWorkersExplorerProps {
  account: ServiceAccount;
  onOpenEndpoints?: () => void;
}

export function CloudflareWorkersExplorer({ account, onOpenEndpoints }: CloudflareWorkersExplorerProps): React.ReactElement {
  const [resources, setResources] = useState<CloudflareResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'WORKERS' | 'PAGES' | 'R2'>('ALL');

  const fetchResources = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const creds = account.getAllCredentials();
      const token = creds['apiToken'] || creds['token'];
      const cfId = creds['accountId'] || creds['cfAccountId'];

      const query = new URLSearchParams({
        serviceId: account.serviceId,
        accountId: account.id,
        ...(token ? { token: String(token) } : {}),
        ...(cfId ? { cfAccountId: String(cfId) } : {}),
      });

      const res = await luthFetch(`/api/services/resources?${query.toString()}`);
      const data = await res.json();
      if (data.error) setApiError(data.error);
      if (data.resources && Array.isArray(data.resources)) setResources(data.resources);
      else setResources([]);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, [account.id]);

  const filtered = resources.filter((r) => {
    const q = searchQuery.toLowerCase();
    const match = r.name.toLowerCase().includes(q) || (r.url || '').toLowerCase().includes(q);
    if (selectedFilter === 'WORKERS') return match && r.type === 'WORKER';
    if (selectedFilter === 'PAGES') return match && r.type === 'PAGES_PROJECT';
    if (selectedFilter === 'R2') return match && r.type === 'R2_BUCKET';
    return match;
  });

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap bg-neutral-900/90 p-2.5 border border-neutral-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 z-10" />
          <BaseInput type="text" placeholder="Search workers, pages, routes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8" />
        </div>
        <div className="flex items-center gap-1.5">
          {(['ALL', 'WORKERS', 'PAGES', 'R2'] as const).map((tab) => (
            <BaseButton key={tab} type="button" size="sm" variant={selectedFilter === tab ? 'accent' : 'ghost'} onClick={() => setSelectedFilter(tab)} className="text-[10px] font-bold uppercase">{tab}</BaseButton>
          ))}
          <BaseButton type="button" size="sm" variant="secondary" onClick={fetchResources} disabled={loading} className="text-[10px] uppercase font-bold">
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh
          </BaseButton>
        </div>
      </div>

      {apiError && (
        <div className="p-2 border border-rose-800 bg-rose-950/40 text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
          <div><div className="font-bold text-xs uppercase">Cloudflare Response</div><div className="text-[11px] leading-relaxed">{apiError}</div></div>
        </div>
      )}

      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-neutral-950 border border-neutral-800 text-neutral-500 space-y-2">
            <Cpu className="w-8 h-8 mx-auto opacity-30 text-orange-400" />
            <div className="text-xs uppercase font-bold text-neutral-400">No Cloudflare resources found</div>
            <div className="text-[11px] text-neutral-500">
              {apiError ? 'Check error above and verify API Token permissions.' : 'No active Workers or Pages deployments found under this Account ID.'}
            </div>
            {onOpenEndpoints && (
              <BaseButton type="button" size="sm" variant="secondary" onClick={onOpenEndpoints} className="mt-2 text-[10px] uppercase font-bold">
                Run Cloudflare Endpoints
              </BaseButton>
            )}
          </div>
        ) : (
          filtered.map((r) => {
            const isWorker = r.type === 'WORKER';
            const isPages = r.type === 'PAGES_PROJECT';
            return (
              <div key={r.id} className="p-3 bg-neutral-950 border border-neutral-800 hover:border-orange-500/50 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase border bg-emerald-950/60 text-emerald-300 border-emerald-800">
                      <CheckCircle className="w-2.5 h-2.5" />{r.status}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase border ${isWorker ? 'bg-orange-950/60 text-orange-300 border-orange-800' : isPages ? 'bg-purple-950/60 text-purple-300 border-purple-800' : 'bg-cyan-950/60 text-cyan-300 border-cyan-800'}`}>
                      {isWorker ? <Cpu className="w-2.5 h-2.5" /> : isPages ? <AppWindow className="w-2.5 h-2.5" /> : <Database className="w-2.5 h-2.5" />}
                      {r.type.replace('_PROJECT', '')}
                    </span>
                    <span className="font-bold text-neutral-100 text-xs">{r.name}</span>
                  </div>
                  {r.url && (
                    <a href={r.url.startsWith('http') ? r.url : `https://${r.url}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 hover:underline">
                      <Globe className="w-3 h-3" /><span>{r.url.replace(/^https?:\/\//, '')}</span><ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                {r.routes && r.routes.length > 0 && (
                  <div className="text-[11px] text-neutral-400 bg-neutral-900/60 p-1.5 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 uppercase mr-1">Routes:</span>
                    <span>{r.routes.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-900">
                  <span>ID: {r.id}</span>
                  {r.updatedAt && <span>Updated: {new Date(r.updatedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
