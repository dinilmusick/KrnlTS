import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { BaseButton, BaseInput, BaseTextarea } from '@ultrst-armada/floks';
import { SolarSystemEntity } from './types.js';
import type { SubAgentSkill } from '../../../libraries/agentContracts.js';
import type { ToolDefinition } from '../../../libraries/toolContracts.js';
import type { ModelCatalogEntry } from '../../../libraries/aiContracts.js';
import type { IntelligenceSpecPreset, PreferencesSpecPreset } from '../../../libraries/intelligenceContracts.js';
import { IconSelectorRow } from './IconSelectorRow.js';
import { SpecSelectionRow } from './SpecSelectionRow.js';
import { ModelOverrideTileMenu } from './ModelOverrideTileMenu.js';
import { EntitySkillsSection } from './EntitySkillsSection.js';

export interface EntityDetailsPanelProps {
  entity: SolarSystemEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEntity: Partial<SolarSystemEntity>) => void;
  availableTools?: ToolDefinition[];
  catalog?: ModelCatalogEntry[];
  presets?: IntelligenceSpecPreset[];
  preferencesPresets?: PreferencesSpecPreset[];
}

export const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  entity,
  isOpen,
  onClose,
  onSave,
  availableTools = [],
  catalog = [],
  presets = [],
  preferencesPresets = []
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Brain');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [intelligenceSpecId, setIntelligenceSpecId] = useState('');
  const [preferenceSpecId, setPreferenceSpecId] = useState('');
  const [overrideModel, setOverrideModel] = useState(false);
  const [manualModels, setManualModels] = useState<string[]>([]);
  const [skills, setSkills] = useState<SubAgentSkill[]>([]);

  useEffect(() => {
    if (entity) {
      setName(entity.name || '');
      setDescription(entity.description || '');
      setIconName(entity.iconName || (entity.kind === 'agent' ? 'Brain' : 'Cpu'));
      setSystemPrompt(entity.systemPrompt || '');
      setIntelligenceSpecId(entity.intelligenceSpecId || '');
      setPreferenceSpecId(entity.preferenceSpecId || '');
      setOverrideModel(Boolean(entity.overrideModel));
      setManualModels(entity.manualModels || (entity.modelId ? [entity.modelId] : []));
      setSkills(entity.skills || []);
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const isAgentOrSubAgent = entity.kind === 'agent' || entity.kind === 'subagent';

  const handleSave = () => {
    onSave({
      id: entity.id,
      kind: entity.kind,
      name,
      description,
      iconName,
      systemPrompt,
      intelligenceSpecId,
      preferenceSpecId,
      overrideModel,
      manualModels,
      selectedModel: manualModels[0],
      skills
    });
    onClose();
  };

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none overscroll-contain"
    >
      <div
        className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-xl bg-[var(--skipo-surface)] border-2 border-[var(--skipo-border-color)] shadow-2xl overflow-hidden text-[var(--skipo-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--skipo-border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--skipo-accent)]/15 border border-[var(--skipo-accent)] text-[var(--skipo-accent)] flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-sm text-[var(--skipo-text)]">
                  Configure {entity.kind.toUpperCase()} Sphere
                </h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--skipo-matte-bg)] border border-[var(--skipo-border-color)] text-[var(--skipo-accent)]">
                  WEIGHT: {entity.weight || 10}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[var(--skipo-text-muted)]">
                Tune parameters, custom name, operational instructions & skills
              </p>
            </div>
          </div>
          <BaseButton size="sm" variant="ghost" onClick={onClose} className="p-1 h-7 w-7" icon={<X size={15} />} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">Entity Name</span>
            <BaseInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Custom Name" className="text-xs h-8" />
          </div>

          {isAgentOrSubAgent && (
            <IconSelectorRow
              selectedIcon={iconName}
              onSelectIcon={(ic) => setIconName(ic)}
            />
          )}

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">Description</span>
            <BaseInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="text-xs h-8" />
          </div>

          {isAgentOrSubAgent && (
            <>
              <SpecSelectionRow
                intelligenceSpecId={intelligenceSpecId}
                onChangeIntelligenceSpecId={(id) => setIntelligenceSpecId(id)}
                preferenceSpecId={preferenceSpecId}
                onChangePreferenceSpecId={(id) => setPreferenceSpecId(id)}
                presets={presets}
                preferencesPresets={preferencesPresets}
              />

              <ModelOverrideTileMenu
                overrideModel={overrideModel}
                onToggleOverride={(on) => setOverrideModel(on)}
                manualModels={manualModels}
                onAddManualModel={(mId) => setManualModels((prev) => Array.from(new Set([...prev, mId])))}
                onRemoveManualModel={(mId) => setManualModels((prev) => prev.filter((m) => m !== mId))}
                catalog={catalog}
              />

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">System Prompt Directives</span>
                <BaseTextarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  placeholder="Operational prompt instructions and constraints..."
                  className="text-xs font-mono"
                />
              </div>
            </>
          )}

          {entity.kind === 'subagent' && (
            <EntitySkillsSection
              skills={skills}
              onChangeSkills={setSkills}
              availableTools={availableTools}
            />
          )}
        </div>

        <div className="p-3 border-t border-[var(--skipo-border-color)] flex justify-end gap-2">
          <BaseButton size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </BaseButton>
          <BaseButton size="sm" variant="accent" onClick={handleSave} icon={<Save size={12} />}>
            Save Changes
          </BaseButton>
        </div>
      </div>
    </div>
  );
};

export default EntityDetailsPanel;
