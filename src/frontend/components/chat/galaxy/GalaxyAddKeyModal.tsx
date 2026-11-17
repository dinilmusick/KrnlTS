/**
 * ASCII Architecture Flowchart: GalaxyAddKeyModal
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize GalaxyAddKeyModal   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        GalaxyAddKeyModal         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           handleSubmit           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React, { useState } from 'react';
import { Key, Plus } from 'lucide-react';
import { BaseButton, BaseInput } from '@ultrst-armada/floks';
import { NeoSelect } from '../../common/NeoSelect.js';
import { ProviderId } from '../../../types/app.js';
import { PROVIDERS_META, PROVIDER_COLORS } from '../../../../backend/providers.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface GalaxyAddKeyModalProps {
  onClose: () => void;
  onAddKey: (providerId: ProviderId, email: string, keyVal: string) => Promise<void>;
}


// ════ GALAXYADDKEYMODAL IMPLEMENTATION ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const GalaxyAddKeyModal: React.FC<GalaxyAddKeyModalProps> = ({ onClose, onAddKey }) => {
  const [newKeyProvider, setNewKeyProvider] = useState<ProviderId>('google');
  const [newKeyEmail, setNewKeyEmail] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyEmail.trim() || !newKeyValue.trim()) return;
    await onAddKey(newKeyProvider, newKeyEmail.trim(), newKeyValue.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-4 rounded-xl border-2 border-slate-700 bg-slate-900 space-y-3 font-mono text-xs shadow-2xl overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Key size={14} /> REGISTER API KEY ACCOUNT
          </span>
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            type="button"
          >
            ✕
          </BaseButton>
        </div>

        <div className="space-y-1">
          <NeoSelect
            label="PROVIDER"
            value={newKeyProvider}
            onChange={(val) => setNewKeyProvider(val as ProviderId)}
            options={Object.values(PROVIDERS_META)
              .map(p => ({
                value: p.id,
                label: p.name,
                dotColor: PROVIDER_COLORS[p.id as ProviderId]
              }))}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">LABEL</label>
          <BaseInput
            placeholder="e.g. user@company.com"
            value={newKeyEmail}
            onChange={(e) => setNewKeyEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">SECRET VALUE</label>
          <BaseInput
            type="password"
            placeholder="Paste API Key secret..."
            value={newKeyValue}
            onChange={(e) => setNewKeyValue(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <BaseButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            CANCEL
          </BaseButton>
          <BaseButton
            type="submit"
            variant="accent"
            size="sm"
            icon={<Plus size={14} />}
          >
            CONFIRM
          </BaseButton>
        </div>
      </form>
    </div>
  );
};