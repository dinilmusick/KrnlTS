import React from 'react';
import { CheckCircle2, XCircle, Clock, Loader2, Ban, Workflow, Terminal } from 'lucide-react';
import { BaseBadge } from '@ultrst-armada/floks';
import type { AgentExecutionState } from '../../../../backend/agentic/chat/types.js';

export interface AgentExecutionCardProps { execution: AgentExecutionState; }

export const AgentExecutionCard: React.FC<AgentExecutionCardProps> = ({ execution }) => {
  if (!execution.workflows.length) return null;
  const icon = (status: string) => status === 'success'
    ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--skipo-success)' }} />
    : status === 'failed'
    ? <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--skipo-danger)' }} />
    : status === 'blocked'
    ? <Ban className="w-3.5 h-3.5" style={{ color: 'var(--skipo-warning)' }} />
    : status === 'running'
    ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--skipo-info)' }} />
    : <Clock className="w-3.5 h-3.5" style={{ color: 'var(--skipo-text-muted)' }} />;

  return <div className="rounded-lg border p-2.5 my-2 space-y-2 text-xs" style={{ backgroundColor: 'var(--skipo-surface)', borderColor: 'var(--skipo-border-color)', color: 'var(--skipo-text)' }}>
    <div className="flex items-center justify-between text-[11px] font-semibold pb-1.5 border-b" style={{ borderColor: 'var(--skipo-border-color)' }}>
      <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" style={{ color: 'var(--skipo-info)' }} /><span>Workflow Execution</span></span>
      {execution.totalDurationMs !== undefined && <span className="font-mono text-[10px]" style={{ color: 'var(--skipo-text-muted)' }}>{execution.totalDurationMs}ms</span>}
    </div>
    <div className="space-y-2">
      {execution.workflows.map((workflow, idx) => <div key={workflow.workflowId + '-' + idx} className="rounded p-2 border flex items-center justify-between" style={{ backgroundColor: 'var(--skipo-surface-hover)', borderColor: 'var(--skipo-border-color)' }}>
        <span className="flex items-center gap-1.5 font-semibold"><Workflow className="w-3 h-3" style={{ color: 'var(--skipo-info)' }} /><span>{workflow.workflowName}</span></span>
        <div className="flex items-center gap-1.5">{workflow.status === 'success' && <BaseBadge variant="accent" className="text-[9px] py-0 px-1.5">completed</BaseBadge>}{icon(workflow.status)}<span className="capitalize text-[10px]" style={{ color: 'var(--skipo-text-muted)' }}>{workflow.status}</span></div>
      </div>)}
    </div>
  </div>;
};

export default AgentExecutionCard;
