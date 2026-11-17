/**
 * @file gemini.ts
 * @description Gemini Service Facade for Srkl-Engine.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 5 & 6.
 */

import { geminiClient } from './client/geminiClient';
import { geminiServer } from './server/geminiServer';
import { remoteGemini } from './remote/remoteGemini';

export const runtime: 'client' | 'server' = 'server';
export const deployment: 'local' | 'remote' = 'remote';

export const service = {
  name: 'gemini',
  runtime,
  deployment,
  generateText: async (apiKey: string, prompt: string, model?: string) => {
    return remoteGemini.generate(apiKey, prompt, model);
  },
  client: geminiClient,
  server: geminiServer,
};

export const geminiService = service;
