/**
 * @file inferenceExecutor.ts
 * @description Multi-provider AI Inference Engine supporting Google Gemini REST & OpenAI-compatible endpoints
 */

import type { ProviderId } from '../ai-provider/types.js';
import type { InferenceOptions, InferenceResult, ToolCall } from './types.js';
import { classifyAndFormatError } from './errorParser.js';

const PROVIDER_BASE_URLS: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  cerebras: 'https://api.cerebras.ai/v1',
  together: 'https://api.together.xyz/v1',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  huggingface: 'https://api-inference.huggingface.co/v1',
};

async function executeGoogleInference(
  modelId: string,
  apiKey: string,
  prompt: string,
  options?: InferenceOptions
): Promise<InferenceResult> {
  const normModel = modelId.startsWith('models/') ? modelId.replace('models/', '') : modelId;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${normModel}:generateContent?key=${apiKey}`;

  const reqBody: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (options?.tools && options.tools.length > 0) {
    reqBody.tools = [{
      functionDeclarations: options.tools.map((t: any) => ({
        name: t.function?.name || t.name,
        description: t.function?.description || t.description || '',
        parameters: t.function?.parameters || t.parameters || { type: 'OBJECT', properties: {} },
      })),
    }];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
    signal: options?.signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw classifyAndFormatError('google', normModel, txt, res.status).error;
  }

  const data: any = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n');
  const fcList = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

  let toolCalls: ToolCall[] | undefined;
  if (fcList.length > 0) {
    toolCalls = fcList.map((fc: any, i: number) => ({
      id: `call_gemini_${Date.now()}_${i}`,
      type: 'function',
      function: { name: fc.name, arguments: JSON.stringify(fc.args || {}) },
    }));
  }

  return { text: textParts || (toolCalls ? `Invoked tool(s)` : ''), toolCalls };
}

export async function performInference(
  providerId: ProviderId,
  modelId: string,
  apiKey: string,
  prompt: string,
  options?: InferenceOptions
): Promise<InferenceResult> {
  const start = Date.now();
  const normModel = modelId.startsWith('models/') ? modelId.replace('models/', '') : modelId;

  if (providerId === 'google') {
    const res = await executeGoogleInference(normModel, apiKey, prompt, options);
    res.durationMs = Date.now() - start;
    return res;
  }

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(`[${providerId.toUpperCase()} AUTH]: Missing API key for ${providerId}`);
  }

  const baseUrl = PROVIDER_BASE_URLS[providerId] || 'https://api.groq.com/openai/v1';
  const reqBody: any = {
    model: normModel,
    messages: options?.messages || [{ role: 'user', content: prompt }],
    temperature: options?.temperature ?? 0.7,
  };
  if (options?.maxTokens) reqBody.max_tokens = options.maxTokens;
  if (options?.tools && options.tools.length > 0) {
    reqBody.tools = options.tools;
    if (options.tool_choice) reqBody.tool_choice = options.tool_choice;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey.trim().replace(/[\r\n\t]/g, '')}`,
  };
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = 'https://kloks-ai.dev';
    headers['X-Title'] = 'Kloks AI Gateway';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody),
    signal: options?.signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw classifyAndFormatError(providerId, normModel, txt, res.status).error;
  }

  const data: any = await res.json();
  const choice = data.choices?.[0]?.message;
  let toolCalls: ToolCall[] | undefined;

  if (choice?.tool_calls && Array.isArray(choice.tool_calls) && choice.tool_calls.length > 0) {
    toolCalls = choice.tool_calls.map((tc: any, i: number) => ({
      id: tc.id || `call_${Date.now()}_${i}`,
      type: 'function',
      function: {
        name: tc.function?.name || 'unknown_tool',
        arguments: typeof tc.function?.arguments === 'string'
          ? tc.function.arguments
          : JSON.stringify(tc.function?.arguments || {}),
      },
    }));
  }

  return {
    text: choice?.content || (toolCalls ? `Tool usage invoked` : ''),
    toolCalls,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
    durationMs: Date.now() - start,
  };
}

export class InferenceExecutorService {
  async execute(
    providerId: ProviderId,
    modelId: string,
    apiKey: string,
    prompt: string,
    options?: InferenceOptions
  ): Promise<InferenceResult> {
    return performInference(providerId, modelId, apiKey, prompt, options);
  }
}

export const inferenceExecutor = new InferenceExecutorService();
