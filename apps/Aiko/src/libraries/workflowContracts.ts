export interface AikoWorkflow {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  icon?: string;
  fodProjectId: string;
  intelligenceSpecId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowInput {
  name: string;
  description: string;
  icon?: string;
  intelligenceSpecId?: string | null;
}
