/**
 * @file geminiServer.ts
 * @description Local server proxy for Gemini requests.
 */

export class GeminiServer {
  public async handleGenerate(prompt: string) {
    return { text: `Processed: ${prompt}`, timestamp: Date.now() };
  }
}

export const geminiServer = new GeminiServer();
