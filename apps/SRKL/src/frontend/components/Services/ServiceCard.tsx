/**
 * @file ServiceCard.tsx
 * @description Card component for an individual service provider in the directory.
 * Adheres to Skipo code limits (<200 lines).
 */

import React from 'react';
import { ShieldCheck, Eye, Server, Trash2 } from 'lucide-react';
import { BaseButton } from '@skipo/ui';
import { ServiceProvider } from '@/libraries/core/ServiceProvider';
import { Badge } from '../common/Badge';

interface ServiceCardProps {
  key?: React.Key;
  service: ServiceProvider;
  onInspect: () => void;
  onRemove?: () => void;
}

export function ServiceCard({
  service,
  onInspect,
  onRemove,
}: ServiceCardProps): React.ReactElement {
  return (
    <div className="p-4 border border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 transition-all rounded-sm font-mono space-y-4 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">{service.name}</h3>
              <span className="text-[10px] text-neutral-400">v{service.version}</span>
            </div>
          </div>
          <Badge status={service.status} />
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
          {service.description}
        </p>
      </div>

      <div className="pt-3 border-t border-neutral-800/80 space-y-2 text-xs">
        <div className="flex justify-between text-neutral-300 text-[11px]">
          <span className="text-neutral-400">Provider Type:</span>
          <span>{service.providerType}</span>
        </div>
        <div className="flex justify-between text-neutral-300 text-[11px]">
          <span className="text-neutral-400">Actions:</span>
          <span className="font-semibold text-neutral-200">{service.definition.actions.length} Supported</span>
        </div>
        <div className="flex justify-between text-neutral-300 text-[11px]">
          <span className="text-neutral-400">Endpoints:</span>
          <span>{service.definition.endpoints.length} Routes</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Auth: {service.definition.authType}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2 text-xs">
        <BaseButton
          type="button"
          size="sm"
          variant="secondary"
          onClick={onInspect}
          className="flex-1 flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5 text-neutral-400 mr-1" />
          <span>Inspect Spec</span>
        </BaseButton>
        {onRemove && (
          <BaseButton
            type="button"
            size="sm"
            variant="danger"
            onClick={onRemove}
            title="Remove service adapter"
            className="flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span className="text-[11px]">Remove</span>
          </BaseButton>
        )}
      </div>
    </div>
  );
}
