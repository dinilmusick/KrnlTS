/**
 * @file EndpointTileCard.tsx
 * @description Big interactive tile representing an endpoint with in-place payload input & live result presentation.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Play, Shield, Lock, Unlock } from 'lucide-react';
import { EndpointDefinition, ServiceDefinition } from '@/libraries/types/srkl';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceProvider } from '@/libraries/core/ServiceProvider';
import {
  executeEndpoint,
  EndpointExecutionParams,
  EndpointExecutionResult,
} from '@/libraries/utils/endpointExecutor';
import { EndpointPayloadEditor } from './EndpointPayloadEditor';
import { EndpointResultViewer } from './EndpointResultViewer';
import { BaseIconButton } from '../../common/BaseIconButton';

interface EndpointTileCardProps {
  endpoint: EndpointDefinition;
  account: ServiceAccount;
  provider?: ServiceProvider;
  definition?: ServiceDefinition;
  onLogActivity?: (
    serviceId: string,
    actionId: string,
    status: 'SUCCESS' | 'FAILED',
    durationMs: number,
    error?: string | null
  ) => void;
}

export function EndpointTileCard({
  endpoint,
  account,
  provider,
  definition,
  onLogActivity,
}: EndpointTileCardProps): React.ReactElement {
  const [params, setParams] = useState<EndpointExecutionParams>({
    pathParams: {},
    queryParams: {},
    headers: {},
    body: endpoint.bodyTemplate || (endpoint.method === 'POST' ? '{\n  "prompt": "Hello Gemini"\n}' : ''),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EndpointExecutionResult | null>(null);

  const handleExecute = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await executeEndpoint(account, endpoint, params, provider, definition);
      setResult(res);
      onLogActivity?.(
        account.serviceId,
        endpoint.name,
        res.success ? 'SUCCESS' : 'FAILED',
        res.durationMs,
        res.error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-950/80 border-blue-500 text-blue-400';
      case 'POST':
        return 'bg-amber-950/80 border-amber-500 text-amber-400';
      case 'PUT':
      case 'PATCH':
        return 'bg-purple-950/80 border-purple-500 text-purple-400';
      case 'DELETE':
        return 'bg-rose-950/80 border-rose-500 text-rose-400';
      default:
        return 'bg-neutral-900 border-neutral-600 text-neutral-300';
    }
  };

  return (
    <div
      id={`endpoint-tile-${endpoint.name.toLowerCase().replace(/\s+/g, '-')}`}
      className="p-4 border-2 border-neutral-800 bg-neutral-900/60 rounded-none space-y-3 font-mono text-xs shadow-[4px_4px_0px_#000000] hover:border-amber-500/60 transition-all flex flex-col justify-between"
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-2.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 text-[10px] font-black border tracking-wider uppercase ${getMethodBadgeClass(
                endpoint.method
              )}`}
            >
              {endpoint.method}
            </span>
            <h3 className="text-xs font-black text-neutral-100 uppercase tracking-wide">
              {endpoint.name}
            </h3>
            {endpoint.authentication ? (
              <span className="flex items-center gap-1 text-[9px] text-amber-400 bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 font-bold">
                <Lock className="w-2.5 h-2.5" /> AUTH
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] text-neutral-400 bg-neutral-950 border border-neutral-800 px-1.5 py-0.5">
                <Unlock className="w-2.5 h-2.5" /> PUBLIC
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 break-all font-bold font-mono">
            {endpoint.path}
          </p>
          {endpoint.description && (
            <p className="text-[10px] text-neutral-500 italic">
              {endpoint.description}
            </p>
          )}
        </div>

        {/* Big Execution Trigger Button (Icon-Only BaseIconButton) */}
        <BaseIconButton
          tooltip={`Execute ${endpoint.name} (${endpoint.method})`}
          icon={<Play className={`w-4 h-4 fill-current ${isLoading ? 'animate-pulse' : ''}`} />}
          variant="primary"
          size="md"
          disabled={isLoading}
          onClick={handleExecute}
        />
      </div>

      {/* Middle: In-Tile Payload and Parameter Fields */}
      <EndpointPayloadEditor
        endpoint={endpoint}
        params={params}
        onChange={setParams}
      />

      {/* Bottom: Result Presentation Area right on the tile */}
      <EndpointResultViewer
        result={result}
        isLoading={isLoading}
        onClear={() => setResult(null)}
      />
    </div>
  );
}
