import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Workflow as WorkflowIcon } from 'lucide-react';
import { BaseButton, BaseInput } from '@ultrst-armada/floks';
import { apiClient } from '../../../../libraries/apiClient.js';
import type { AikoWorkflow } from '../../../../libraries/workflowContracts.js';
import { WorkflowTileCard } from './WorkflowTileCard.js';
import { WorkflowGraphView } from './WorkflowGraphView.js';

export interface WorkflowsViewProps {
  activeWorkspace?: string | null;
  activeWorkspaceName?: string;
  onNavigateToChat?: (workflowId?: string) => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({ activeWorkspace, activeWorkspaceName = 'Default Vault', onNavigateToChat }) => {
  const workspace = activeWorkspace || null;
  const [workflows, setWorkflows] = useState<AikoWorkflow[]>([]);
  const [selected, setSelected] = useState<AikoWorkflow | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    if (!workspace) { setWorkflows([]); setLoading(false); return; }
    try {
      const result = await apiClient.getWorkflows(workspace);
      setWorkflows(result.workflows || []);
    } finally { setLoading(false); }
  }, [workspace]);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    const name = window.prompt('Workflow name');
    if (!workspace || !name?.trim()) return;
    const description = window.prompt('Workflow description') || '';
    setCreating(true);
    try {
      const result = await apiClient.createWorkflow(workspace, { name, description });
      if (result.workflow) setSelected(result.workflow);
      await load();
    } finally { setCreating(false); }
  };

  const remove = async (workflow: AikoWorkflow) => {
    if (!window.confirm('Delete workflow "' + workflow.name + '"?')) return;
    await apiClient.deleteWorkflow(workspace, workflow.id);
    if (selected?.id === workflow.id) setSelected(null);
    await load();
  };

  if (selected) return <WorkflowGraphView workflow={selected} onBack={() => setSelected(null)} />;
  if (!workspace) return <div className="w-full h-full p-6 text-sm text-[var(--skipo-text-muted)]">Select a workspace before managing workflows.</div>;

  const filtered = workflows.filter(w => (w.name + ' ' + w.description).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6 flex flex-col gap-4 text-[var(--skipo-text,#f8fafc)]">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--skipo-border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--skipo-accent,#6366f1)] text-white flex items-center justify-center"><WorkflowIcon size={16} /></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider">Workflows</h2>
            <p className="text-[11px] text-[var(--skipo-text-muted)]">{activeWorkspaceName} · semantic workflow directory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BaseInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter workflows..." className="text-xs h-8 w-44" />
          <BaseButton size="sm" variant="accent" onClick={create} disabled={creating} icon={<Plus size={13} />}>Create Workflow</BaseButton>
          <BaseButton size="sm" variant="secondary" onClick={() => void load()} disabled={loading} icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}>Sync</BaseButton>
          {onNavigateToChat && <BaseButton size="sm" variant="ghost" onClick={() => onNavigateToChat(selected?.id)}>Chat</BaseButton>}
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(workflow => <WorkflowTileCard key={workflow.id} workflow={workflow} onSelect={setSelected} onDelete={remove} />)}
        {filtered.length === 0 && <div className="col-span-full py-16 text-center text-sm text-[var(--skipo-text-muted)]">No workflows in this workspace.</div>}
      </div>
    </div>
  );
};

export default WorkflowsView;
