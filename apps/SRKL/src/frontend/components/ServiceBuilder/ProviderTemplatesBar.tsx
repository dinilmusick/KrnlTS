'use client';

/**
 * @file ProviderTemplatesBar.tsx
 * @description Quick template loader bar for ServiceBuilder.
 * Adheres strictly to Skipo code limits (<200 lines).
 */

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { ServiceRegistry } from '@/libraries/services/registry';
import { ServiceDefinition } from '@/libraries/types/srkl';
import { BaseIconButton } from '../common/BaseIconButton';
import { BaseButton } from '@skipo/ui';

interface ProviderTemplatesBarProps {
  onApplyTemplate: (tpl: ServiceDefinition) => void;
  onReset: () => void;
  hasInput: boolean;
}

export function ProviderTemplatesBar({
  onApplyTemplate,
  onReset,
  hasInput,
}: ProviderTemplatesBarProps): React.ReactElement {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 p-3 border text-xs"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        boxShadow: 'var(--skipo-shadow)',
        borderRadius: 'var(--skipo-radius)',
      }}
    >
      <span className="uppercase font-bold text-[11px]" style={{ color: 'var(--skipo-text-muted)' }}>
        Provider Templates:
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {ServiceRegistry.getAvailableTemplates().map((tpl) => (
          <BaseButton
            key={tpl.identifier}
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onApplyTemplate(tpl)}
            className="px-2.5 py-1 text-[11px] uppercase font-mono font-bold"
          >
            {tpl.name}
          </BaseButton>
        ))}
        {hasInput && (
          <BaseIconButton
            tooltip="Reset Form to Blank State"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            variant="ghost"
            size="sm"
            onClick={onReset}
          />
        )}
      </div>
    </div>
  );
}
