import React, { useState } from 'react';
import { Plus, X, Cpu } from 'lucide-react';
import { BaseButton, BaseInput } from '@ultrst-armada/floks';
import type { ModelCatalogEntry } from '../../../libraries/aiContracts.js';

const PROVIDER_COLORS: Record<string, string> = {
  google: '#4285F4', groq: '#F55036', cerebras: '#FF6B35', openrouter: '#6366F1',
  together: '#8B5CF6', nvidia: '#76B900', huggingface: '#FFD21E', anthropic: '#D97757', openai: '#10A37F',
};

export interface ModelOverrideTileMenuProps {
  overrideModel?: boolean;
  onToggleOverride: (enabled: boolean) => void;
  manualModels?: string[];
  onAddManualModel: (modelId: string) => void;
  onRemoveManualModel: (modelId: string) => void;
  catalog?: ModelCatalogEntry[];
  title?: string;
}

export const ModelOverrideTileMenu: React.FC<ModelOverrideTileMenuProps> = ({
  overrideModel = false,
  onToggleOverride,
  manualModels = [],
  onAddManualModel,
  onRemoveManualModel,
  catalog = [],
  title = 'Model Override'
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [filterText, setFilterText] = useState('');

  const filteredCatalog = catalog.filter((c) => {
    const query = filterText.toLowerCase();
    return c.id.toLowerCase().includes(query) || c.name.toLowerCase().includes(query) || c.providerId.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-2 pt-1 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">
            {title}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
            overrideModel
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
              : 'border-[var(--skipo-border-color)] bg-[var(--skipo-matte-bg)] text-[var(--skipo-text-muted)]'
          }`}>
            {overrideModel ? 'Manual Active' : 'Spec Routing'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleOverride(!overrideModel)}
          className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all border ${
            overrideModel
              ? 'bg-[var(--skipo-accent)] text-white border-[var(--skipo-accent)]'
              : 'bg-[var(--skipo-matte-bg)] text-[var(--skipo-text-muted)] border-[var(--skipo-border-color)] hover:border-[var(--skipo-accent)]'
          }`}
        >
          {overrideModel ? 'Override Enabled' : 'Enable Override'}
        </button>
      </div>

      {overrideModel && (
        <div className="p-2.5 rounded-lg border border-[var(--skipo-border-color)] bg-[var(--skipo-matte-bg)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-[var(--skipo-text-muted)]">
              Prescribed Models ({manualModels.length})
            </span>
            <BaseButton
              size="sm"
              variant="secondary"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              icon={<Plus size={11} />}
              className="h-5 text-[9px] px-1.5"
            >
              Add Model
            </BaseButton>
          </div>

          {/* Model Tile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {manualModels.map((mId) => {
              const entry = catalog.find((c) => c.id === mId);
              const provider = entry?.providerId || 'google';
              const dotColor = PROVIDER_COLORS[provider] || '#38BDF8';
              return (
                <div
                  key={mId}
                  className="p-1.5 rounded border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] flex items-center justify-between gap-1 shadow-sm"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40"
                      style={{ backgroundColor: dotColor }}
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-[var(--skipo-text)] truncate">
                        {entry?.name || mId}
                      </div>
                      <div className="text-[8px] text-[var(--skipo-text-muted)] truncate">
                        {provider.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveManualModel(mId)}
                    className="p-1 text-[var(--skipo-text-muted)] hover:text-red-400 rounded shrink-0"
                    title="Remove Model"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}

            {manualModels.length === 0 && (
              <div
                onClick={() => setIsPickerOpen(true)}
                className="col-span-full p-3 rounded border border-dashed border-[var(--skipo-border-color)] text-center text-[10px] text-[var(--skipo-text-muted)] cursor-pointer hover:border-[var(--skipo-accent)]"
              >
                Click + to add
              </div>
            )}
          </div>

          {/* Model Search & Add Dropdown Palette */}
          {isPickerOpen && (
            <div className="p-2 rounded border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] space-y-1.5">
              <div className="flex items-center gap-1">
                <BaseInput
                  placeholder="Filter models..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="text-[10px] h-6 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="p-1 text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)]"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {filteredCatalog.slice(0, 15).map((model) => {
                  const isAdded = manualModels.includes(model.id);
                  const provColor = PROVIDER_COLORS[model.providerId] || '#38BDF8';
                  return (
                    <button
                      key={model.id}
                      type="button"
                      disabled={isAdded}
                      onClick={() => {
                        onAddManualModel(model.id);
                        setIsPickerOpen(false);
                      }}
                      className={`w-full p-1 rounded flex items-center justify-between text-left text-[10px] transition-colors ${
                        isAdded
                          ? 'opacity-40 cursor-not-allowed bg-black/10'
                          : 'hover:bg-white/5 cursor-pointer text-[var(--skipo-text)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: provColor }}
                        />
                        <span className="font-bold truncate">{model.name}</span>
                        <span className="text-[8px] text-[var(--skipo-text-muted)]">
                          ({model.providerId})
                        </span>
                      </div>
                      <span className="text-[8px] text-[var(--skipo-accent)] uppercase shrink-0">
                        {isAdded ? 'Added' : 'Select'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelOverrideTileMenu;
