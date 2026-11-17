import React, { useState } from 'react';
import { Plus, Trash2, Terminal } from 'lucide-react';
import { BaseButton, BaseInput } from '@ultrst-armada/floks';
import type { SubAgentSkill } from '../../../../libraries/agentContracts.js';
import type { ToolDefinition } from '../../../../libraries/toolContracts.js';
import { PasteCurlModal } from '../../common/PasteCurlModal.js';
import { ParsedCurl } from '../../../lib/curlParser.js';

export interface SubAgentSkillsEditorProps {
  skills: SubAgentSkill[];
  onChangeSkills: (skills: SubAgentSkill[]) => void;
  availableTools?: ToolDefinition[];
}

export const SubAgentSkillsEditor: React.FC<SubAgentSkillsEditorProps> = ({
  skills,
  onChangeSkills,
  availableTools = []
}) => {
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillEndpoints, setSkillEndpoints] = useState<string[]>([]);
  const [isCurlOpen, setIsCurlOpen] = useState(false);
  const [pendingEndpoint, setPendingEndpoint] = useState<any>(null);

  const handleApplyCurl = (parsed: ParsedCurl) => {
    if (!skillName.trim()) setSkillName(parsed.suggestedName);
    setSkillDesc(parsed.summary);
    const epRef = `[${parsed.method}] ${parsed.path}`;
    setSkillEndpoints((prev) => Array.from(new Set([...prev, epRef])));
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
    if (!skillName.trim()) return;
    const newSkill: SubAgentSkill = {
      id: `skill-${Date.now()}`,
      name: skillName.trim(),
      description: skillDesc.trim(),
      endpointRefs: skillEndpoints,
      endpoint: pendingEndpoint || undefined
    };
    onChangeSkills([...skills, newSkill]);
    setSkillName('');
    setSkillDesc('');
    setSkillEndpoints([]);
    setPendingEndpoint(null);
  };

  const toggleEndpointRef = (epPath: string) => {
    setSkillEndpoints((prev) =>
      prev.includes(epPath) ? prev.filter((p) => p !== epPath) : [...prev, epPath]
    );
  };

  return (
    <div className="space-y-2 pt-2 border-t border-[var(--skipo-border-color)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-[var(--skipo-accent)]">
          Subagent Skills ({skills.length})
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
            onClick={() => onChangeSkills(skills.filter((item) => item.id !== s.id))}
            className="p-1 rounded text-red-400 hover:bg-red-400/10"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      <div className="p-2.5 rounded-lg border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">+ Add a Skill</span>
          <BaseButton
            size="sm"
            variant="ghost"
            onClick={() => setIsCurlOpen(true)}
            className="text-[10px] h-6 px-2 text-[var(--skipo-accent)]"
            icon={<Terminal size={11} />}
          >
            Paste cURL
          </BaseButton>
        </div>

        <BaseInput
          placeholder="Skill name (e.g. Document Extraction)"
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          className="text-xs h-7"
        />
        <BaseInput
          placeholder="Skill description"
          value={skillDesc}
          onChange={(e) => setSkillDesc(e.target.value)}
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
            <span className="text-[9px] uppercase text-[var(--skipo-text-muted)] font-bold">Link to Endpoints:</span>
            <div className="max-h-24 overflow-y-auto space-y-1 p-1 bg-[var(--skipo-matte-bg)] rounded border border-[var(--skipo-border-color)]">
              {availableTools.flatMap((t) =>
                (t.features || []).map((f) => {
                  const epKey = `@${t.name}/${f.name}`;
                  return (
                    <label key={epKey} className="flex items-center gap-1.5 text-[10px] cursor-pointer hover:bg-white/5 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={skillEndpoints.includes(epKey)}
                        onChange={() => toggleEndpointRef(epKey)}
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
          Add Skill to Subagent
        </BaseButton>
      </div>

      <PasteCurlModal
        isOpen={isCurlOpen}
        onClose={() => setIsCurlOpen(false)}
        onApply={handleApplyCurl}
        title="Import Subagent Skill cURL"
        description="Paste cURL to populate skill name, endpoint, method, and payload"
      />
    </div>
  );
};
