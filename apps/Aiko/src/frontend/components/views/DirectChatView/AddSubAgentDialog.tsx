import React, { useState } from 'react';
import { X, Cpu, Wrench, Sparkles, Terminal, Brain, Shield, Zap } from 'lucide-react';
import { BaseButton, BaseInput, BaseTextarea } from '@ultrst-armada/floks';
import { SubAgentDefinition, SubAgentSkill } from '../../../../backend/types/agentTypes.js';
import { ToolDefinition } from '../../../../backend/types/tools.js';
import { SubAgentSkillsEditor } from './SubAgentSkillsEditor.js';

export interface AddSubAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subAgent: SubAgentDefinition) => void;
  availableTools?: ToolDefinition[];
}

const ICON_OPTIONS = [
  { name: 'Cpu', icon: Cpu },
  { name: 'Brain', icon: Brain },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Wrench', icon: Wrench },
  { name: 'Terminal', icon: Terminal },
  { name: 'Shield', icon: Shield },
  { name: 'Zap', icon: Zap }
];

export const AddSubAgentDialog: React.FC<AddSubAgentDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  availableTools = []
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Cpu');
  const [skills, setSkills] = useState<SubAgentSkill[]>([]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    const subAgent: SubAgentDefinition = {
      id: `subagent-custom-${Date.now()}`,
      name: name.trim(),
      role: 'custom',
      description: description.trim() || 'Custom user-defined subagent',
      systemPrompt: systemPrompt.trim(),
      iconName: selectedIcon,
      skills,
      isCustom: true,
      canPromptOtherSubAgents: true
    };
    onSave(subAgent);
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
            <div className="w-7 h-7 rounded bg-[var(--skipo-accent)]/15 border border-[var(--skipo-accent)] text-[var(--skipo-accent)] flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-[var(--skipo-text)]">Define Subagent</h3>
              <p className="text-[10px] font-mono text-[var(--skipo-text-muted)]">
                Create specialized subagent with custom instructions & skills
              </p>
            </div>
          </div>
          <BaseButton size="sm" variant="ghost" onClick={onClose} className="p-1 h-7 w-7" icon={<X size={15} />} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">Subagent Name</span>
            <BaseInput
              placeholder="e.g. ResearchSynthesizer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">Select Icon</span>
            <div className="flex items-center gap-2">
              {ICON_OPTIONS.map((opt) => {
                const IconCmp = opt.icon;
                const isSelected = selectedIcon === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setSelectedIcon(opt.name)}
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[var(--skipo-accent)] bg-[var(--skipo-accent)]/20 text-[var(--skipo-accent)] shadow-sm'
                        : 'border-[var(--skipo-border-color)] bg-[var(--skipo-matte-bg)] text-[var(--skipo-text-muted)] hover:border-[var(--skipo-accent)]/50'
                    }`}
                  >
                    <IconCmp size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">Description</span>
            <BaseInput
              placeholder="Brief description of subagent capabilities"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">
              System Prompt Instructions
            </span>
            <BaseTextarea
              placeholder="Paste system prompt, reasoning rules, or operational guidelines..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              className="text-xs font-mono"
            />
          </div>

          <SubAgentSkillsEditor
            skills={skills}
            onChangeSkills={setSkills}
            availableTools={availableTools}
          />
        </div>

        <div className="p-3 border-t border-[var(--skipo-border-color)] flex justify-end gap-2">
          <BaseButton size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </BaseButton>
          <BaseButton size="sm" variant="accent" onClick={handleSave} disabled={!name.trim()}>
            Save Subagent
          </BaseButton>
        </div>
      </div>
    </div>
  );
};

export default AddSubAgentDialog;
