/**
 * @file googleAiStudioDefinition.ts
 * @description Authentic Google AI Studio Blueprint ServiceDefinition.
 * Conforms to Google AI Studio, Cloud Resource Manager, Cloud Run, and Gemini APIs.
 * File size < 200 lines strictly.
 */

import { ServiceDefinition } from '../types/srkl';

export const GOOGLE_AI_STUDIO_DEFINITION: ServiceDefinition = {
  identifier: 'google-ai-studio',
  name: 'Google AI Studio',
  description: 'Developer workspace for Google AI Studio & Cloud Run: tracks developing web & Android applets, prompt pipelines, and tuned models.',
  version: '1.4.0',
  authType: 'API_KEY',
  credentialFields: [
    {
      name: 'googleAccount',
      label: 'Google Account Email (MANDATORY)',
      type: 'string',
      required: true,
      secret: false,
      description: 'Primary Google account email registered with Google AI Studio & GCP [MANDATORY]',
      guideUrl: 'https://myaccount.google.com/',
    },
    {
      name: 'apiKey',
      label: 'Google AI Studio API Key (MANDATORY)',
      type: 'password',
      required: true,
      secret: true,
      description: 'Mandatory API key from aistudio.google.com/apikey required for Gemini models & prompts [MANDATORY]',
      guideUrl: 'https://aistudio.google.com/apikey',
    },
    {
      name: 'projectId',
      label: 'Google Cloud Project ID (MANDATORY)',
      type: 'string',
      required: true,
      secret: false,
      description: 'GCP Project ID or Number (e.g. 207414612407 or 14948072) hosting Cloud Run services [MANDATORY]',
      guideUrl: 'https://console.cloud.google.com/projectselector2/home/dashboard',
    },
    {
      name: 'accessToken',
      label: 'OAuth 2.0 Access Token (MANDATORY)',
      type: 'password',
      required: true,
      secret: true,
      description: 'Google OAuth 2.0 Bearer token with run.services.list scope to scan Cloud Run services & apps [MANDATORY]',
      guideUrl: 'https://developers.google.com/oauthplayground/',
    },
  ],
  endpoints: [
    {
      name: 'Get Service Health',
      method: 'GET',
      path: '/api/google-ai-studio/health',
      authentication: true,
      description: 'Surveil live Google AI Studio API reachability, model access, and latency',
    },
    {
      name: 'List Resources',
      method: 'GET',
      path: '/api/google-ai-studio/resources',
      authentication: true,
      description: 'Enumerate linked foundation models, fine-tuned models, and developing apps',
    },
    {
      name: 'Verify Credentials',
      method: 'POST',
      path: '/api/google-ai-studio/verify',
      authentication: true,
      description: 'Validate Google account and authenticate API key against Google Generative Language API',
    },
    {
      name: 'List Developing Apps',
      method: 'GET',
      path: '/api/google-ai-studio/apps',
      authentication: true,
      description: 'Enumerate active web and Android applications developing in Google AI Studio for this account',
    },
    {
      name: 'Scan Developing Apps',
      method: 'POST',
      path: '/api/google-ai-studio/scan',
      authentication: true,
      description: 'Enumerate and discover active AI Studio applets and fine-tuned models',
    },
    {
      name: 'List Gemini Models',
      method: 'GET',
      path: 'https://generativelanguage.googleapis.com/v1beta/models',
      authentication: true,
      description: 'Enumerate available Gemini foundation models via Google Developer API',
    },
    {
      name: 'List Tuned Models',
      method: 'GET',
      path: 'https://generativelanguage.googleapis.com/v1beta/tunedModels',
      authentication: true,
      description: 'List user fine-tuned models created and managed in Google AI Studio',
    },
    {
      name: 'List Cached Contexts',
      method: 'GET',
      path: 'https://generativelanguage.googleapis.com/v1beta/cachedContents',
      authentication: true,
      description: 'List active long-context prompt token caches created in Google AI Studio',
    },
    {
      name: 'List Files API Assets',
      method: 'GET',
      path: 'https://generativelanguage.googleapis.com/v1beta/files',
      authentication: true,
      description: 'List media & documents uploaded to Google AI Studio for prompt grounding',
    },
    {
      name: 'Count Tokens',
      method: 'POST',
      path: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:countTokens',
      authentication: true,
      description: 'Calculate prompt token usage against Gemini 2.5 Flash foundation model',
    },
    {
      name: 'List Cloud Run Services',
      method: 'GET',
      path: 'https://run.googleapis.com/v2/projects/{projectId}/locations/-/services',
      authentication: true,
      description: 'Enumerate live deployed Cloud Run application services for project',
    },
    {
      name: 'Get Account Profile',
      method: 'GET',
      path: 'https://www.googleapis.com/oauth2/v3/userinfo',
      authentication: true,
      description: 'Verify connected Google developer account profile and email identity',
    },
  ],
  actions: [
    {
      id: 'VERIFY_ACCOUNT',
      name: 'Verify Account',
      actionType: 'READ',
      description: 'Authenticate API key and account against Google AI Studio',
    },
    {
      id: 'LIST_APPS',
      name: 'List Developing Apps',
      actionType: 'READ',
      description: 'Enumerate all active developing apps and applets for this Google account',
    },
    {
      id: 'SCAN_MODELS',
      name: 'Scan Tuned Models',
      actionType: 'REFRESH',
      description: 'Fetch user fine-tuned models and synchronize with applet catalog',
    },
  ],
  resources: [
    {
      type: 'APP',
      name: 'AI Studio Developing App',
      description: 'Web or Android application actively developing under this Google account in AI Studio',
      supportedActions: ['READ', 'REFRESH'],
      hasChildren: false,
    },
    {
      type: 'TUNED_MODEL',
      name: 'Fine-Tuned Model',
      description: 'Custom fine-tuned Gemini model artifact created in Google AI Studio',
      supportedActions: ['READ'],
      hasChildren: false,
    },
    {
      type: 'PROJECT',
      name: 'Google Cloud Project',
      description: 'Google Cloud project linked to AI Studio environment and billing',
      supportedActions: ['READ'],
      hasChildren: true,
    },
  ],
  pollingIntervalSeconds: 120,
};
