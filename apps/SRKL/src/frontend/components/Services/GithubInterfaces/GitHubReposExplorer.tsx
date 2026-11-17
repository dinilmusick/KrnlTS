import { luthFetch } from '../../../auth/luthAuthClient';
'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, GitBranch } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { RepoItem, GitHubRepoCard } from './GitHubRepoCard';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface GitHubReposExplorerProps {
  account: ServiceAccount;
  onOpenEndpoints?: () => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export function GitHubReposExplorer({
  account,
  onOpenEndpoints,
}: GitHubReposExplorerProps): React.ReactElement {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const creds = account.getAllCredentials();
      const token = creds['token'] || creds['accessToken'] || creds['apiKey'] || creds['pat'];
      const owner = creds['owner'] || creds['account'] || account.name;
      const query = new URLSearchParams({
        serviceId: account.serviceId,
        accountId: account.id,
        ...(owner ? { owner: String(owner) } : {}),
        ...(token ? { token: String(token) } : {}),
      });

      const res = await luthFetch(`/api/services/resources?${query.toString()}`);
      const data = await res.json();
      if (data.resources && Array.isArray(data.resources)) {
        const repoList: RepoItem[] = data.resources
          .filter((r: any) => r.type === 'REPOSITORY' || r.resourceType === 'repository')
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            fullName: r.fullName || `${owner}/${r.name}`,
            private: !!r.private,
            htmlUrl: r.htmlUrl || `https://github.com/${owner}/${r.name}`,
            description: r.description,
            language: r.language,
            stargazersCount: r.stargazersCount || 0,
            forksCount: r.forksCount || 0,
            defaultBranch: r.defaultBranch || 'main',
            updatedAt: r.updatedAt,
          }));
        setRepos(repoList);
      }
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, [account.id]);

  const filtered = repos.filter((r) => {
    const matches =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.language || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'PUBLIC') return matches && !r.private;
    if (filterType === 'PRIVATE') return matches && r.private;
    return matches;
  });

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Search & Filter Controls */}
      <div
        className="flex items-center justify-between gap-2 flex-wrap p-2.5 border"
        style={{
          backgroundColor: 'var(--skipo-surface)',
          borderColor: 'var(--skipo-border-color)',
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 pointer-events-none" />
          <BaseInput
            type="text"
            placeholder="Search repositories by name, language, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 py-1 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'PUBLIC', 'PRIVATE'] as const).map((tab) => (
            <BaseButton
              key={tab}
              size="sm"
              variant={filterType === tab ? 'accent' : 'ghost'}
              onClick={() => setFilterType(tab)}
              className="px-2 py-0.5 text-[10px] font-bold uppercase"
            >
              {tab}
            </BaseButton>
          ))}

          <BaseButton
            size="sm"
            variant="secondary"
            onClick={fetchRepos}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase font-bold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </BaseButton>
        </div>
      </div>

      {/* Repositories List */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div
            className="p-8 text-center border space-y-2"
            style={{
              backgroundColor: 'var(--skipo-surface)',
              borderColor: 'var(--skipo-border-color)',
            }}
          >
            <GitBranch className="w-8 h-8 mx-auto opacity-30" />
            <div className="text-xs uppercase font-bold">No repositories found</div>
            <div className="text-[11px] opacity-70">
              Ensure your GitHub Personal Access Token is configured in account settings.
            </div>
            {onOpenEndpoints && (
              <BaseButton
                size="sm"
                variant="secondary"
                onClick={onOpenEndpoints}
                className="mt-2 text-[10px] uppercase font-bold"
              >
                Run List Repositories API Endpoint
              </BaseButton>
            )}
          </div>
        ) : (
          filtered.map((repo) => <GitHubRepoCard key={repo.id} repo={repo} />)
        )}
      </div>
    </div>
  );
}
