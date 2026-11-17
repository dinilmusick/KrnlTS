/**
 * @file ServiceEndpointsModal.tsx
 * @description Master window opened on tile double-click.
 * Shows clean Backblaze Bucket Explorer for Backblaze and endpoint runner for services.
 * File size < 200 lines strictly.
 */

import React, { useMemo, useState } from 'react';
import { BaseButton } from '@skipo/ui';
import { ServiceDefinition, EndpointDefinition } from '@/libraries/types/srkl';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceProvider } from '@/libraries/core/ServiceProvider';
import { BaseModal } from '../../common/BaseModal';
import { EndpointTileCard } from './EndpointTileCard';
import { getServiceVisualConfig } from '../serviceIcons';
import { BackblazeExplorer } from '../BackblazeInterfaces/BackblazeExplorer';
import { GoogleAiStudioAppsExplorer } from '../GoogleAiStudio/GoogleAiStudioAppsExplorer';
import { VercelDeploymentsExplorer } from '../VercelInterfaces/VercelDeploymentsExplorer';
import { GitHubReposExplorer } from '../GithubInterfaces/GitHubReposExplorer';
import { CloudflareWorkersExplorer } from '../CloudflareInterfaces/CloudflareWorkersExplorer';
import { ServiceRegistry } from '@/libraries/services/registry';

interface ServiceEndpointsModalProps {
  account: ServiceAccount | null;
  definition?: ServiceDefinition;
  provider?: ServiceProvider;
  isOpen: boolean;
  onClose: () => void;
  onLogActivity?: (
    serviceId: string,
    actionId: string,
    status: 'SUCCESS' | 'FAILED',
    durationMs: number,
    error?: string | null
  ) => void;
}

export function ServiceEndpointsModal({
  account,
  definition,
  provider,
  isOpen,
  onClose,
  onLogActivity,
}: ServiceEndpointsModalProps): React.ReactElement | null {
  if (!account) return null;

  const [activeTab, setActiveTab] = useState<'VIEW' | 'ENDPOINTS'>('VIEW');
  const isBackblaze = account.serviceId.includes('backblaze');
  const isGoogleAiStudio = account.serviceId.includes('google-ai-studio') || account.serviceId === 'google-ai-studio';
  const isVercel = account.serviceId.includes('vercel');
  const isGithub = account.serviceId.includes('github');
  const isCloudflare = account.serviceId.includes('cloudflare');
  const hasExplorerView = isBackblaze || isGoogleAiStudio || isVercel || isGithub || isCloudflare;

  const visual = getServiceVisualConfig(account.serviceId);
  const IconComponent = visual.icon;

  const endpoints: EndpointDefinition[] = useMemo(() => {
    const def = definition || ServiceRegistry.getDefaultDefinitions().find((d) => d.identifier === account.serviceId);
    if (def?.endpoints && def.endpoints.length > 0) return def.endpoints;
    if (def?.actions && def.actions.length > 0) {
      return def.actions.map((act) => ({
        name: act.name,
        method: act.actionType === 'READ' ? 'GET' : 'POST',
        path: `/actions/${act.id.toLowerCase()}`,
        authentication: true,
        description: act.description,
      }));
    }
    return [
      { name: 'Get Service Health', method: 'GET', path: '/api/services/health', authentication: true, description: 'Surveil live service reachability & latency' },
      { name: 'List Resources', method: 'GET', path: '/api/services/resources', authentication: true, description: 'Enumerate linked cloud resources' },
    ];
  }, [definition, account.serviceId]);

  const credsCount = Object.keys(account.getAllCredentials()).length;
  const viewTitle = isBackblaze ? 'Bucket Explorer' : isGoogleAiStudio ? 'AI Studio Workspace' : isVercel ? 'Deployments Explorer' : isGithub ? 'Repositories Explorer' : isCloudflare ? 'Workers & Pages' : 'Endpoints Runner';
  const viewSubtitle = isBackblaze ? 'BACKBLAZE B2 BUCKETS & OBJECTS' : isGoogleAiStudio ? 'APPS & CLOUD RUN CONTROL' : isVercel ? 'VERCEL DEPLOYMENTS & LIVE SITES' : isGithub ? 'GITHUB REPOSITORIES & CI/CD' : isCloudflare ? 'CLOUDFLARE WORKERS & PAGES' : `SERVICE RUNNER • ${endpoints.length} ENDPOINTS`;
  const viewTabLabel = isGoogleAiStudio ? 'Developing Apps' : isVercel ? 'Deployments' : isGithub ? 'Repositories' : isCloudflare ? 'Workers & Pages' : 'Browser';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${account.name} • ${viewTitle}`}
      subtitle={viewSubtitle}
      icon={<IconComponent className={`w-4 h-4 ${visual.accentText}`} />}
      maxWidth="5xl"
    >
      <div className="space-y-3 font-mono text-xs">
        {/* Service Header Strip */}
        <div className="flex items-center justify-between p-2.5 bg-neutral-950 border-2 border-neutral-800 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: account.status === 'ONLINE' ? 'var(--skipo-success)' : 'var(--skipo-accent)',
                boxShadow: account.status === 'ONLINE' ? '0 0 8px var(--skipo-success)' : 'none',
              }}
            />
            <span className="text-neutral-200 font-bold uppercase text-xs">{account.name}</span>
            <span className="text-neutral-500 text-[10px]">[{account.serviceId}]</span>
          </div>

          <div className="flex items-center gap-2">
            {hasExplorerView && !isBackblaze && (
              <div className="flex border border-neutral-800 bg-neutral-900 text-[10px]">
                <BaseButton
                  type="button"
                  size="sm"
                  variant={activeTab === 'VIEW' ? 'secondary' : 'ghost'}
                  onClick={() => setActiveTab('VIEW')}
                  className="px-2.5 py-1 uppercase font-bold"
                >
                  {viewTabLabel}
                </BaseButton>
                <BaseButton
                  type="button"
                  size="sm"
                  variant={activeTab === 'ENDPOINTS' ? 'secondary' : 'ghost'}
                  onClick={() => setActiveTab('ENDPOINTS')}
                  className="px-2.5 py-1 uppercase font-bold"
                >
                  API Endpoints ({endpoints.length})
                </BaseButton>
              </div>
            )}
            <span className="px-2 py-0.5 border border-neutral-800 bg-neutral-900 text-[10px] text-neutral-400">
              {credsCount} SECRETS ATTACHED
            </span>
          </div>
        </div>

        {/* Content routing */}
        {isBackblaze ? (
          <BackblazeExplorer account={account} />
        ) : isGoogleAiStudio && activeTab === 'VIEW' ? (
          <GoogleAiStudioAppsExplorer account={account} onOpenEndpoints={() => setActiveTab('ENDPOINTS')} />
        ) : isVercel && activeTab === 'VIEW' ? (
          <VercelDeploymentsExplorer account={account} onOpenEndpoints={() => setActiveTab('ENDPOINTS')} />
        ) : isGithub && activeTab === 'VIEW' ? (
          <GitHubReposExplorer account={account} onOpenEndpoints={() => setActiveTab('ENDPOINTS')} />
        ) : isCloudflare && activeTab === 'VIEW' ? (
          <CloudflareWorkersExplorer account={account} onOpenEndpoints={() => setActiveTab('ENDPOINTS')} />
        ) : (
          /* General Service Endpoint Matrix */
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              {endpoints.map((ep, idx) => (
                <EndpointTileCard
                  key={`${ep.name}-${idx}`}
                  endpoint={ep}
                  account={account}
                  provider={provider}
                  definition={definition}
                  onLogActivity={onLogActivity}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
