import { ServiceDefinition } from '../types/srkl';

export const GEMINI_DEFINITION: ServiceDefinition = {
  identifier: 'google-gemini',
  name: 'Google Gemini',
  description: 'Multimodal AI Foundation models, token quotas, and context cache surveillance.',
  version: '2.5.0',
  authType: 'API_KEY',
  credentialFields: [
    { name: 'apiKey', label: 'Gemini API Key', type: 'password', required: true, secret: true, description: 'Google AI Studio API key', guideUrl: 'https://aistudio.google.com/apikey' },
    { name: 'projectNumber', label: 'Google Cloud Project ID', type: 'string', required: false, secret: false, description: 'Optional GCP project ID', guideUrl: 'https://console.cloud.google.com/' },
  ],
  endpoints: [
    { name: 'List Models', method: 'GET', path: '/v1beta/models', authentication: true, description: 'List available Foundation models' },
    { name: 'Generate Content', method: 'POST', path: '/v1beta/models/{model}:generateContent', authentication: true, description: 'Generate multimodal inferences' },
    { name: 'Count Tokens', method: 'POST', path: '/v1beta/models/{model}:countTokens', authentication: true, description: 'Calculates prompt token payload' },
  ],
  actions: [
    { id: 'LIST_MODELS', name: 'List Models', actionType: 'READ', description: 'Enumerate models' },
    { id: 'TEST_PROMPT', name: 'Test Inference', actionType: 'EXECUTE', description: 'Run test prompt inference' },
    { id: 'CHECK_QUOTA', name: 'Check Quota', actionType: 'READ', description: 'Surveil token rate limits' },
    { id: 'REFRESH', name: 'Refresh Health', actionType: 'REFRESH', description: 'Poll model endpoints' },
  ],
  resources: [
    { type: 'model', name: 'AI Model', description: 'Gemini Foundation model', supportedActions: ['READ', 'EXECUTE'], hasChildren: false },
    { type: 'cached_content', name: 'Cached Context', description: 'Context cache token session', supportedActions: ['READ', 'DELETE'], hasChildren: false },
  ],
  pollingIntervalSeconds: 120,
};
