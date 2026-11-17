export class GatewayHttpTransport {
  public encode(payload: unknown): string {
    return JSON.stringify(payload);
  }

  public async send(endpoint: string, encodedBody: string): Promise<Response> {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: encodedBody,
    });
  }

  public async decode<T = unknown>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`Gateway HTTP error: ${res.statusText}`);
    return res.json() as Promise<T>;
  }
}

export const httpTransport = new GatewayHttpTransport();
