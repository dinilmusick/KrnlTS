/**
 * ASCII Architecture Flowchart: SingleKeyCard
 *
 *   ┌──────────────────────────────────┐
 *   │       Initialize SingleKeyCard   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │    Render Single Key Card UI     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React, { useState } from 'react';
import { Key, Trash2, CheckCircle2, ChevronDown, ChevronUp, Edit2, ShieldAlert } from 'lucide-react';
import { BaseButton, BaseInput } from '@ultrst-armada/floks';
import { ApiKeyEntry, KeyModelUsageStats } from '../../../../backend/types.js';
import { ModelCheckResultItem } from './KeyModelVerificationSuite.js';

export interface SingleKeyCardProps {
  apiKey: ApiKeyEntry;
  usageStats?: KeyModelUsageStats[];
  isTargetedKey: boolean;
  isTargetedProvider: boolean;
  checkingModelsKeyId: string | null;
  modelCheckResults?: Record<string, ModelCheckResultItem[]>;
  expandedKeys: Record<string, boolean>;
  onToggleExpand: (keyId: string, expand: boolean) => void;
  onCheckModels: (keyId: string) => void;
  onVerifyKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
  onUpdateKeyLabel: (id: string, label: string) => void;
}

export const SingleKeyCard: React.FC<SingleKeyCardProps> = ({
  apiKey,
  isTargetedKey,
  checkingModelsKeyId,
  expandedKeys,
  onToggleExpand,
  onCheckModels,
  onDeleteKey,
  onUpdateKeyLabel
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(apiKey.label || '');
  const isExpanded = !!expandedKeys[apiKey.id];
  const isChecking = checkingModelsKeyId === apiKey.id;

  const handleSaveLabel = () => {
    onUpdateKeyLabel(apiKey.id, labelValue);
    setIsEditingLabel(false);
  };

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all duration-200 ${
        isTargetedKey
          ? 'bg-[var(--skipo-surface-hover)] border-[var(--skipo-accent)] shadow-[0_0_12px_rgba(99,102,241,0.2)]'
          : 'bg-[var(--skipo-surface)] border-[var(--skipo-border-color)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--skipo-surface-hover)] border border-[var(--skipo-border-color)] text-[var(--skipo-accent)] flex items-center justify-center shrink-0">
            <Key size={15} />
          </div>

          <div className="min-w-0">
            {isEditingLabel ? (
              <div className="flex items-center gap-1.5">
                <BaseInput
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  className="text-xs h-7 py-0.5 px-2"
                />
                <BaseButton size="sm" variant="accent" onClick={handleSaveLabel}>
                  Save
                </BaseButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[var(--skipo-text)] truncate">
                  {apiKey.label || apiKey.providerId.toUpperCase() + ' Key'}
                </span>
                <button
                  onClick={() => setIsEditingLabel(true)}
                  className="text-[var(--skipo-text-muted)] hover:text-[var(--skipo-accent)] p-0.5"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
            <p className="font-mono text-[11px] text-[var(--skipo-text-muted)] truncate">
              {apiKey.key.slice(0, 8)}...{apiKey.key.slice(-4)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {apiKey.status === 'valid' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--skipo-surface-hover)] border border-[var(--skipo-success,#10b981)] text-[var(--skipo-success,#10b981)]">
              <CheckCircle2 size={11} /> Valid
            </span>
          )}
          {apiKey.status === 'invalid' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--skipo-surface-hover)] border border-[var(--skipo-danger,#ef4444)] text-[var(--skipo-danger,#ef4444)]">
              <ShieldAlert size={11} /> Invalid
            </span>
          )}

          <BaseButton
            size="sm"
            variant="secondary"
            onClick={() => onCheckModels(apiKey.id)}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Check Models'}
          </BaseButton>

          <BaseButton
            size="sm"
            variant="ghost"
            onClick={() => onDeleteKey(apiKey.id)}
            icon={<Trash2 size={13} className="text-red-400" />}
          />

          <button
            onClick={() => onToggleExpand(apiKey.id, !isExpanded)}
            className="p-1.5 text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)] rounded"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleKeyCard;
