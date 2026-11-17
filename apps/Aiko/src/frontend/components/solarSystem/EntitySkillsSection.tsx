import React, { useState } from 'react';
import { Plus, Trash2, Terminal, Check } from 'lucide-react';
import { BaseButton, BaseInput } from '@ultrst-armada/floks';
import type { SubAgentSkill } from '../../../libraries/agentContracts.js';
import type { ToolDefinition } from '../../../libraries/toolContracts.js';
import { PasteCurlModal } from '../common/PasteCurlModal.js';
import { ParsedCurl } from '../../lib/curlParser.js';

export interface EntitySkillsSectionProps {
  skills: SubAgentSkill[];
  onChangeSkills: (skills: SubAgentSkill[]) => void;
  availableTools?: ToolDefinition[];
}

export const EntitySkillsSection: React.FC<EntitySkillsSectionProps> = ({
  skills,
  onChangeSkills,
  availableTools = []
}) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);
  const [pendingEndpoint, setPendingEndpoint] = useState<any>(null);

  const handleApplyCurl = (parsed: ParsedCurl) => {
    if (!newSkillName.trim()) setNewSkillName(parsed.suggestedName);
    setNewSkillDesc(parsed.summary);
    const epRef = `[${parsed.method}] ${parsed.path}`;
    setSelectedEndpoints(prev => Array.from(new Set([...prev, epRef])));
    setPendingEndpoint({
      method: parsed.method,
      url: parsed.url,
      path: parsed.path,
      headers: parsed.headers,
      payload: parsed.jsonPayload,
      rawCurl: parsed.summary
    });
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const skill: SubAgentSkill = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      description: newSkillDesc.trim(),
      endpointRefs: selectedEndpoints,
      endpoint: pendingEndpoint || undefined
    };
    onChangeSkills([...skills, skill]);
    setNewSkillName('');
    setNewSkillDesc('');
    setSelectedEndpoints([]);
    setPendingEndpoint(null);
  };

  const toggleEndpoint = (epKey: string) => {
    setSelectedEndpoints(prev =>
      prev.includes(epKey) ? prev.filter(p => p !== epKey) : [...prev, epKey]
    );
  };

  return (
    <div className="space-y-2 pt-2 border-t border-[var(--skipo-border-color)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-[var(--skipo-accent)]">
          Assigned Skills ({skills.length})
        </span>
      </div>

      {skills.map((s) => (
        <div key={s.id} className="p-2.5 rounded-lg border border-[var(--skipo-border-color)] bg-[var(--skipo-matte-bg)] flex justify-between items-start gap-2">
          <div className="space-y-1">
            <div className="font-bold text-[11px] text-[var(--skipo-text)]">{s.name}</div>
            <p className="text-[10px] text-[var(--skipo-text-muted)]">{s.description}</p>
            {s.endpoint && (
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
                <span className="px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 uppercase font-bold">
                  {s.endpoint.method}
                </span>
                <span>{s.endpoint.path}</span>
                {s.endpoint.payload && (
                  <span className="text-[var(--skipo-text-muted)]">
                    ({Object.keys(s.endpoint.payload).length} payload keys)
                  </span>
                )}
              </div>
            )}
            {s.endpointRefs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {s.endpointRefs.map((ref, idx) => (
                  <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)] font-mono text-[var(--skipo-info)]">
                    {ref}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChangeSkills(skills.filter(item => item.id !== s.id))}
            className="p-1 rounded text-red-400 hover:bg-red-400/10"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      <div className="p-2.5 rounded-lg border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">+ Add Skill</span>
          <BaseButton
            size="sm"
            variant="ghost"
            onClick={() => setIsCurlModalOpen(true)}
            className="text-[10px] h-6 px-2 text-[var(--skipo-accent)]"
            icon={<Terminal size={11} />}
          >
            Paste cURL
          </BaseButton>
        </div>

        <BaseInput
          placeholder="Skill name"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          className="text-xs h-7"
        />
        <BaseInput
          placeholder="Skill description"
          value={newSkillDesc}
          onChange={(e) => setNewSkillDesc(e.target.value)}
          className="text-xs h-7"
        />

        {pendingEndpoint && (
          <div className="p-1.5 rounded bg-[var(--skipo-matte-bg)] border border-emerald-500/40 text-[10px] font-mono flex items-center justify-between text-emerald-400">
            <span>cURL: {pendingEndpoint.method} {pendingEndpoint.path}</span>
            <button type="button" onClick={() => setPendingEndpoint(null)} className="text-red-400 hover:underline">Clear</button>
          </div>
        )}

        {availableTools.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] uppercase text-[var(--skipo-text-muted)] font-bold">Link Endpoints:</span>
            <div className="max-h-24 overflow-y-auto space-y-1 p-1 bg-[var(--skipo-matte-bg)] rounded border border-[var(--skipo-border-color)]">
              {availableTools.flatMap(t =>
                (t.features || []).map(f => {
                  const epKey = `@${t.name}/${f.name}`;
                  return (
                    <label key={epKey} className="flex items-center gap-1.5 text-[10px] cursor-pointer hover:bg-white/5 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={selectedEndpoints.includes(epKey)}
                        onChange={() => toggleEndpoint(epKey)}
                        className="rounded border-[var(--skipo-border-color)]"
                      />
                      <span className="text-[var(--skipo-text)]">{epKey}</span>
                      <span className="text-[var(--skipo-text-muted)] text-[9px]">({f.endpoint.method} {f.endpoint.path})</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        <BaseButton size="sm" variant="secondary" onClick={handleAddSkill} icon={<Plus size={12} />} className="text-[10px] h-6 px-2">
          Attach Skill
        </BaseButton>
      </div>

      <PasteCurlModal
        isOpen={isCurlModalOpen}
        onClose={() => setIsCurlModalOpen(false)}
        onApply={handleApplyCurl}
        title="Import Skill Endpoint cURL"
        description="Paste cURL to extract skill name, path, method, and payload"
      />
    </div>
  );
};

export default EntitySkillsSection;
