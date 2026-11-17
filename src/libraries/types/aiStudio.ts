/**
 * @file aiStudio.ts
 * @description Catalog interfaces and models for Google AI Studio applets and fine-tuned models.
 * Strictly environment-neutral.
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
