import { RoutePromptInput, RoutePromptOutput } from '../RoutePromptAtom.js';
import { matchProvider } from '../helper_functions/matchProvider.js';

export const main = async (input: RoutePromptInput): Promise<RoutePromptOutput> => {
  const model = input.model || 'gemini-2.5-flash';
  const latency = input.maxLatencyMs ?? 150;
  const { provider, score } = matchProvider(model, latency);

  return {
    selectedProvider: provider,
    providerScore: score,
    promptEcho: input.prompt || 'Hello Aiko Router',
    dispatchedAt: Date.now()
  };
};
