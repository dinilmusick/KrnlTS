/**
 * @file remoteGemini.ts
 * @description Remote Google GenAI caller.
 */

export class RemoteGemini {
  public async generate(apiKey: string, prompt: string, model: string = 'gemini-2.5-flash') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
    return res.json();
  }
}

export const remoteGemini = new RemoteGemini();
