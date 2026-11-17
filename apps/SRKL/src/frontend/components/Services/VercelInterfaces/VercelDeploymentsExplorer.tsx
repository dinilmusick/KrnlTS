import { luthFetch } from '../../../auth/luthAuthClient';
/**
 * @file VercelDeploymentsExplorer.tsx
 * @description Dedicated interactive Vercel Deployments & Projects Explorer.
 * File size < 200 lines strictly.
 */

import React, { useState, useEffect } from 'react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ExternalLink, RefreshCw, Globe, GitCommit, CheckCircle, Clock, Search } from 'lucide-react';

interface DeploymentItem {
  id: string;
  name: string;
  url: string;
  state: string;
  target?: string;
  createdAt: number | string;
  creator?: string;
  meta?: Record<string, string>;
}

interface VercelDeploymentsExplorerProps {
  account: ServiceAccount;
  onOpenEndpoints?: () => void;
}

export function VercelDeploymentsExplorer({
  account,
  onOpenEndpoints,
}: VercelDeploymentsExplorerProps): React.ReactElement {
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PRODUCTION' | 'PREVIEW'>('ALL');

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const creds = account.getAllCredentials();
      const token = creds['token'] || creds['accessToken'] || creds['apiKey'] || creds['pat'];
      const query = new URLSearchParams({
        serviceId: account.serviceId,
        accountId: account.id,
        account: String(creds['account'] || account.name),
        ...(token ? { token: String(token) } : {}),
      });

      const res = await luthFetch(`/api/services/resources?${query.toString()}`);
      const data = await res.json();
      if (data.resources && Array.isArray(data.resources)) {
        const deps = data.resources
          .filter((r: any) => r.type === 'DEPLOYMENT')
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            url: r.url,
            state: r.state || 'READY',
            target: r.target || 'production',
            createdAt: r.createdAt,
            creator: r.creator,
            meta: r.meta || {},
          }));
        setDeployments(deps);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [account.id]);

  const filtered = deployments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.meta?.githubCommitMessage || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'PRODUCTION') return matchesSearch && d.target === 'production';
    if (selectedFilter === 'PREVIEW') return matchesSearch && d.target === 'preview';
    return matchesSearch;
  });

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Action and Search Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-neutral-900/90 p-2.5 border border-neutral-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 z-10" />
          <BaseInput
            type="text"
            placeholder="Search deployments by name, URL, or commit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'PRODUCTION', 'PREVIEW'] as const).map((tab) => (
            <BaseButton
              key={tab}
              type="button"
              size="sm"
              variant={selectedFilter === tab ? 'accent' : 'ghost'}
              onClick={() => setSelectedFilter(tab)}
              className="text-[10px] font-bold uppercase"
            >
              {tab}
            </BaseButton>
          ))}

          <BaseButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={fetchDeployments}
            disabled={loading}
            className="text-[10px] uppercase font-bold"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </BaseButton>
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-neutral-950 border border-neutral-800 text-neutral-500 space-y-2">
            <Globe className="w-8 h-8 mx-auto opacity-30 text-neutral-400" />
            <div className="text-xs uppercase font-bold text-neutral-400">No deployments found</div>
            <div className="text-[11px] text-neutral-500">
              Ensure your Vercel Personal Access Token is configured in account settings.
            </div>
            {onOpenEndpoints && (
              <BaseButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={onOpenEndpoints}
                className="mt-2 text-[10px] uppercase font-bold"
              >
                Run List Deployments API Endpoint
              </BaseButton>
            )}
          </div>
        ) : (
          filtered.map((dep) => {
            const isProd = dep.target === 'production';
            const isReady = dep.state.toUpperCase() === 'READY';
            const commitMsg = dep.meta?.githubCommitMessage || dep.meta?.gitCommitMessage;

            return (
              <div key={dep.id} className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase border ${isReady ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-amber-950/60 text-amber-300 border-amber-800'}`}>
                      {isReady ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                      {dep.state}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${isProd ? 'bg-purple-950/60 text-purple-300 border-purple-800' : 'bg-blue-950/60 text-blue-300 border-blue-800'}`}>
                      {dep.target || 'production'}
                    </span>
                    <span className="font-bold text-neutral-100 text-xs">{dep.name}</span>
                  </div>

                  {dep.url && (
                    <a href={dep.url.startsWith('http') ? dep.url : `https://${dep.url}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 hover:underline">
                      <Globe className="w-3 h-3" />
                      <span>{dep.url.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                {commitMsg && (
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] bg-neutral-900/60 p-1.5 border border-neutral-800/80">
                    <GitCommit className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span className="truncate">{commitMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-900">
                  <span>ID: {dep.id}</span>
                  <span>Creator: {dep.creator || 'Vercel User'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
