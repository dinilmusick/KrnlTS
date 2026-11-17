import { luthFetch } from '../../../auth/luthAuthClient';
/**
 * @file GoogleAiStudioAppsExplorer.tsx
 * @description Master explorer for Google AI Studio developing apps & cloud run surveillance.
 * File size < 200 lines strictly.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Search, ShieldCheck, AlertTriangle, Cpu, Cloud } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { AiStudioApp } from '@/libraries/types/aiStudio';
import { GoogleAiStudioAppCard } from './GoogleAiStudioAppCard';
import { GoogleAiStudioAddAppModal } from './GoogleAiStudioAddAppModal';

interface GoogleAiStudioAppsExplorerProps {
  account: ServiceAccount;
  onOpenEndpoints?: () => void;
}

export function GoogleAiStudioAppsExplorer({ account }: GoogleAiStudioAppsExplorerProps): React.ReactElement {
  const [apps, setApps] = useState<AiStudioApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cloudRunInfo, setCloudRunInfo] = useState<{ status?: number; error?: string; hint?: string; count?: number } | null>(null);

  const googleEmail = account.getCredential('googleAccount') || '';
  const apiKey = account.getCredential('apiKey') || '';
  const projectId = account.getCredential('projectId') || '';
  const token = account.getCredential('token') || account.getCredential('accessToken') || '';
  const hasIncompleteCreds = !apiKey || !googleEmail || !token || !projectId;

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { googleAccount: googleEmail };
      if (apiKey) params.apiKey = apiKey;
      if (projectId) params.projectId = projectId;
      if (token) params.token = token;
      const res = await luthFetch(`/api/google-ai-studio/apps?${new URLSearchParams(params).toString()}`);
      const data = await res.json();
      if (data.apps && Array.isArray(data.apps)) setApps(data.apps);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [googleEmail, apiKey, projectId, token]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await luthFetch('/api/google-ai-studio/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleAccount: googleEmail, apiKey, projectId, token }),
      });
      const data = await res.json();
      if (data.apps && Array.isArray(data.apps)) setApps(data.apps);
      if (data.cloudRun) {
        setCloudRunInfo({ status: data.cloudRun.status, error: data.cloudRun.error, hint: data.cloudRun.hint, count: data.cloudRun.servicesCount });
      }
    } catch {}
    setScanning(false);
  };

  const handleAddApp = async (appData: any) => {
    await luthFetch('/api/google-ai-studio/apps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(appData) });
    fetchApps();
  };

  const handleDeleteApp = async (id: string) => {
    await luthFetch(`/api/google-ai-studio/apps/${id}`, { method: 'DELETE' });
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return filterPlatform === 'ALL' ? matchesSearch : matchesSearch && app.platform.toUpperCase().includes(filterPlatform);
  });

  return (
    <div className="space-y-3 font-mono text-xs">
      {hasIncompleteCreds && (
        <div className="p-2.5 border-2 border-amber-600/80 bg-amber-950/40 text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px]">MANDATORY CREDENTIALS REQUIRED</span>
            <p className="text-[10px] text-amber-300/80">
              Google AI Studio scans require: API Key, OAuth Access Token, Google Email, and GCP Project ID. Click the pencil icon on this tile to attach all mandatory credentials.
            </p>
          </div>
        </div>
      )}

      {/* Account Info & Cloud Run Status Strip */}
      <div className="p-2.5 border border-neutral-800 bg-neutral-950 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-200 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACCOUNT: {googleEmail || 'Unspecified'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400">PROJECT: {projectId || '207414612407'}</span>
          {apiKey && (
            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> API KEY ATTACHED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <BaseButton type="button" size="sm" variant="secondary" onClick={handleScan} disabled={scanning || loading}
            className="text-sky-300 text-[10px] font-bold">
            <RefreshCw className={`w-3 h-3 mr-1 ${scanning ? 'animate-spin text-amber-400' : ''}`} />
            <span>{scanning ? 'SCANNING...' : 'SCAN CLOUD & APPS'}</span>
          </BaseButton>
          <BaseButton type="button" size="sm" variant="accent" onClick={() => setIsAddModalOpen(true)}
            className="text-[10px] font-bold">
            <Plus className="w-3 h-3 mr-1" />
            <span>TRACK APPLET</span>
          </BaseButton>
        </div>
      </div>

      {cloudRunInfo && cloudRunInfo.status === 403 && (
        <div className="p-2.5 border border-sky-800/80 bg-sky-950/40 text-[11px] text-sky-200 space-y-1">
          <div className="flex items-center gap-2 text-sky-300 font-bold">
            <Cloud className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span>CLOUD RUN SERVICE API: PERMISSION NOTE</span>
          </div>
          <p className="text-[10px] text-sky-300/90 leading-relaxed">
            Google AI Studio API Keys authenticate the Gemini model suite and fine-tuned models. Listing Cloud Run services requires GCP OAuth authorization (run.services.list).
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex border border-neutral-800 bg-neutral-900 text-[10px] gap-0.5 p-0.5">
          {['ALL', 'WEB', 'ANDROID', 'CLOUD RUN', 'TUNED'].map((p) => (
            <BaseButton key={p} type="button" size="sm" variant={filterPlatform === p ? 'accent' : 'ghost'}
              onClick={() => setFilterPlatform(p)} className="px-2 py-0.5 uppercase font-bold text-[10px]">
              {p}
            </BaseButton>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2" />
          <BaseInput type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search developing applets..." className="w-full pl-7" />
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="p-8 border border-neutral-800 bg-neutral-950/60 text-center space-y-2">
          <p className="text-neutral-300 font-bold">No developing applets or fine-tuned models found.</p>
          <p className="text-[11px] text-neutral-500 max-w-md mx-auto">
            Click &ldquo;SCAN CLOUD &amp; APPS&rdquo; to query Cloud Run Services API and fine-tuned models, or &ldquo;TRACK APPLET&rdquo; to register an applet workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredApps.map((app) => (
            <GoogleAiStudioAppCard key={app.id} app={app} onDelete={handleDeleteApp} />
          ))}
        </div>
      )}

      <GoogleAiStudioAddAppModal
        isOpen={isAddModalOpen}
        googleAccount={googleEmail}
        defaultProjectId={projectId}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddApp}
      />
    </div>
  );
}
