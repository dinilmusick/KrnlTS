import React from 'react';
import { WorkflowsView } from '../../../../components/views/WorkflowsView/index.js';

export interface WorkflowsTabProps {
  activeWorkspace?: string | null;
  activeWorkspaceName?: string;
  onNavigateToChat: () => void;
}

export function WorkflowsTab({ activeWorkspace, activeWorkspaceName, onNavigateToChat }: WorkflowsTabProps) {
  return <WorkflowsView activeWorkspace={activeWorkspace} activeWorkspaceName={activeWorkspaceName} onNavigateToChat={onNavigateToChat} />;
}

export default WorkflowsTab;
