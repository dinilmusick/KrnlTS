import React from 'react';
import { Play, Trash2, Workflow as WorkflowIcon } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import type { AikoWorkflow } from '../../../../libraries/workflowContracts.js';

export interface WorkflowTileCardProps {
  workflow: AikoWorkflow;
  onSelect: (workflow: AikoWorkflow) => void;
  onDelete: (workflow: AikoWorkflow) => void;
}

export function WorkflowTileCard({ workflow, onSelect, onDelete }: WorkflowTileCardProps) {
  return (
    <article className="rounded-xl border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--skipo-accent,#6366f1)] text-white flex items-center justify-center">
          <WorkflowIcon size={17} />
        </div>
        <button aria-label="Delete workflow" onClick={() => onDelete(workflow)} className="text-[var(--skipo-text-muted)] hover:text-red-400">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="min-h-16">
        <h3 className="font-bold text-sm">{workflow.name}</h3>
        <p className="text-[11px] text-[var(--skipo-text-muted)] mt-1 line-clamp-3">{workflow.description || 'No description.'}</p>
      </div>
      <BaseButton size="sm" variant="accent" onClick={() => onSelect(workflow)} icon={<Play size={13} />}>Open Workflow</BaseButton>
    </article>
  );
}
