/**
 * ASCII Architecture Flowchart: SavePrefPresetModal
 *
 *   ┌─────────────────────────────────────┐
 *   │    Initialize SavePrefPresetModal   │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { Sparkles, X, Check, Shield } from 'lucide-react';
import { BaseButton, BaseInput } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface SavePrefPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefPresetName: string;
  setPrefPresetName: (name: string) => void;
  prefPresetDescription: string;
  setPrefPresetDescription: (desc: string) => void;
  selectedPrefSigil: string;
  setSelectedPrefSigil: (sigil: string) => void;
  sigilOptions: Array<{ id: string; label: string }>;
  onConfirm: () => void;
}

// ════ SAVEPREFPRESETMODAL IMPLEMENTATION ═════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const SavePrefPresetModal: React.FC<SavePrefPresetModalProps> = ({
  isOpen,
  onClose,
  prefPresetName,
  setPrefPresetName,
  prefPresetDescription,
  setPrefPresetDescription,
  selectedPrefSigil,
  setSelectedPrefSigil,
  sigilOptions,
  onConfirm
}) => {
  const { setInspectionText } = useBottomStrip();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-mono overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md p-5 rounded-xl border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow-hover)] space-y-4 overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--skipo-border-color)]/30 pb-2">
          <Sparkles className="text-[var(--skipo-accent)]" size={18} />
          <h3 className="font-black text-sm uppercase text-[var(--skipo-text)]">
            SAVE PREFERENCES PRESET
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[var(--skipo-text)] mb-1">
              PRESET NAME
            </label>
            <BaseInput
              value={prefPresetName}
              onChange={e => setPrefPresetName(e.target.value)}
              placeholder="e.g. Free Cloud Cluster"
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--skipo-text)] mb-1">
              DESCRIPTION
            </label>
            <BaseInput
              value={prefPresetDescription}
              onChange={e => setPrefPresetDescription(e.target.value)}
              placeholder="Brief summary of preferences"
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--skipo-text)] mb-1">
              SIGIL IDENTITY
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 bg-[var(--skipo-matte-bg)] rounded border border-[var(--skipo-border-color)]/50">
              {sigilOptions.map(opt => (
                <BaseButton
                  key={opt.id}
                  size="sm"
                  variant={selectedPrefSigil === opt.id ? 'accent' : 'ghost'}
                  onClick={() => setSelectedPrefSigil(opt.id)}
                  onMouseEnter={() => setInspectionText(`SIGIL IDENTITY: ${opt.label.toUpperCase()}`)}
                  onMouseLeave={() => setInspectionText(null)}
                  onFocus={() => setInspectionText(`SIGIL IDENTITY: ${opt.label.toUpperCase()}`)}
                  onBlur={() => setInspectionText(null)}
                  aria-label={opt.label}
                  className={`p-2 justify-center flex items-center ${
                    selectedPrefSigil === opt.id
                      ? 'border-[var(--skipo-accent)] bg-[var(--skipo-accent)]/20 text-[var(--skipo-accent)]'
                      : 'border-[var(--skipo-border-color)]/40 text-[var(--skipo-text-muted)]'
                  }`}
                  icon={<Shield size={16} />}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--skipo-border-color)]/30">
          <BaseButton
            size="sm"
            variant="secondary"
            onClick={onClose}
            onMouseEnter={() => setInspectionText("CANCEL PRESET SAVE")}
            onMouseLeave={() => setInspectionText(null)}
            onFocus={() => setInspectionText("CANCEL PRESET SAVE")}
            onBlur={() => setInspectionText(null)}
            aria-label="Cancel"
            className="px-3"
            icon={<X size={15} />}
          />
          <BaseButton
            size="sm"
            variant="accent"
            disabled={!prefPresetName.trim()}
            onClick={onConfirm}
            onMouseEnter={() => setInspectionText("CONFIRM SAVE PREFERENCE PRESET")}
            onMouseLeave={() => setInspectionText(null)}
            onFocus={() => setInspectionText("CONFIRM SAVE PREFERENCE PRESET")}
            onBlur={() => setInspectionText(null)}
            aria-label="Confirm Save"
            className="px-3"
            icon={<Check size={15} />}
          />
        </div>
      </div>
    </div>
  );
};