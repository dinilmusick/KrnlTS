/**
 * @file ServiceEditCredentialRow.tsx
 * @description Credential input row for ServiceEditModal with visibility toggle and documentation links.
 * Strictly adheres to Skipo code limits (<200 lines).
 */

import React from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { BaseInput } from '@skipo/ui';
import { BaseIconButton } from '../common/BaseIconButton';
import { CredentialField } from '@/libraries/types/srkl';

interface ServiceEditCredentialRowProps {
  field: CredentialField;
  isMandatory: boolean;
  value: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onChange: (val: string) => void;
}

export function ServiceEditCredentialRow({
  field,
  isMandatory,
  value,
  isVisible,
  onToggleVisibility,
  onChange,
}: ServiceEditCredentialRowProps): React.ReactElement {
  const isSecret = field.secret || field.type === 'password';

  return (
    <div className="p-2 border border-neutral-800 bg-neutral-950/70 space-y-1">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="text-neutral-300 font-bold flex items-center gap-1.5">
          <span>{field.label || field.name}</span>
          {isMandatory ? (
            <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/25 text-amber-300 border border-amber-500/60 uppercase font-black">
              MANDATORY
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 bg-neutral-900 text-neutral-500 border border-neutral-800 uppercase">
              OPTIONAL
            </span>
          )}
        </span>
        {field.guideUrl && (
          <a
            href={field.guideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Get {field.label?.split(' ')[0] || field.name}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {field.description && (
        <div className="text-[10px] text-neutral-400 leading-snug">{field.description}</div>
      )}

      <div className="relative flex items-center">
        <BaseInput
          type={isSecret && !isVisible ? 'password' : 'text'}
          value={value || ''}
          placeholder={isMandatory ? `[MANDATORY] ${field.label || field.name}` : `[OPTIONAL] ${field.label || field.name}`}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-2 pr-8 py-1 bg-neutral-900 border border-neutral-700 text-neutral-100 text-[11px] font-mono focus:border-amber-500"
        />
        {isSecret && (
          <BaseIconButton
            tooltip={isVisible ? 'Hide Secret' : 'Reveal Secret'}
            icon={isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            size="sm"
            variant="ghost"
            onClick={onToggleVisibility}
            className="absolute right-1"
          />
        )}
      </div>
    </div>
  );
}
