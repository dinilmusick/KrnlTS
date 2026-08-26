export interface RoutePromptInput {
  model: string;
  prompt: string;
  maxLatencyMs?: number;
}
export interface RoutePromptOutput {
  selectedProvider: string;
  providerScore: number;
  promptEcho: string;
  dispatchedAt: number;
}
