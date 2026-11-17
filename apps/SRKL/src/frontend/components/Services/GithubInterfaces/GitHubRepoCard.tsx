'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { ExternalLink, GitBranch, Star, GitFork, Lock, Globe } from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface RepoItem {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description?: string;
  language?: string;
  stargazersCount?: number;
  forksCount?: number;
  defaultBranch?: string;
  updatedAt?: string;
}

export interface GitHubRepoCardProps {
  repo: RepoItem;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export const GitHubRepoCard: React.FC<GitHubRepoCardProps> = ({ repo }) => {
  return (
    <div
      className="p-3 border transition-colors space-y-1.5"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
              repo.private
                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
            }`}
          >
            {repo.private ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
            {repo.private ? 'Private' : 'Public'}
          </span>

          <span className="font-bold text-xs">{repo.name}</span>
          <span className="opacity-60 text-[10px]">({repo.fullName})</span>
        </div>

        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline"
        >
          <span>View on GitHub</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {repo.description && (
        <div className="opacity-80 text-[11px] line-clamp-2">{repo.description}</div>
      )}

      <div
        className="flex items-center gap-4 text-[10px] pt-1 border-t flex-wrap opacity-70"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        {repo.language && (
          <span className="inline-flex items-center gap-1 text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400" />
          {repo.stargazersCount} stars
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          {repo.forksCount} forks
        </span>
        <span className="inline-flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          {repo.defaultBranch}
        </span>
      </div>
    </div>
  );
};
