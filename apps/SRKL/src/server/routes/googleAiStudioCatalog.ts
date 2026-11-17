/**
 * @file googleAiStudioCatalog.ts
 * @description Catalog interfaces and models for Google AI Studio applets and fine-tuned models.
 * Strictly zero mock/placeholder data - live data only.
 * File size < 200 lines strictly.
 */

export interface AiStudioApp {
  id: string;
  name: string;
  description: string;
  googleAccount: string;
  appletId: string;
  platform: 'Web (React + Vite)' | 'Android (Kotlin + Compose)' | 'Cloud Run' | 'Tuned Model';
  status: 'DEVELOPMENT' | 'STAGING' | 'DEPLOYED';
  model: string;
  projectId?: string;
  devUrl: string;
  shareUrl: string;
  updatedAt: string;
  isCurrentWorkspace?: boolean;
}

export function formatTunedModelApp(tm: any, googleAccount: string, projectId = ''): AiStudioApp {
  const cleanAccount = googleAccount.trim().toLowerCase();
  const rawName = String(tm.name || 'tunedModels/custom');
  const id = `tuned-${rawName.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return {
    id,
    name: tm.displayName || rawName.replace('tunedModels/', ''),
    description: tm.description || `Fine-Tuned model trained in Google AI Studio (${tm.state || 'ACTIVE'})`,
    googleAccount: cleanAccount,
    appletId: rawName,
    platform: 'Tuned Model',
    status: 'DEPLOYED',
    model: tm.baseModel ? String(tm.baseModel).replace('models/', '') : 'gemini-1.5-flash',
    projectId: projectId || '',
    devUrl: '',
    shareUrl: '',
    updatedAt: tm.updateTime || new Date().toISOString(),
  };
}
