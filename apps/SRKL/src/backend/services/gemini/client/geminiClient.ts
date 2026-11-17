/**
 * @file geminiClient.ts
 * @description Client-side Gemini caller.
 */

export class GeminiClient {
  public async prompt(text: string): Promise<string> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text }),
    });
    const data = await res.json();
    return data.text || '';
  }
}

export const geminiClient = new GeminiClient();
