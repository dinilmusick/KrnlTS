/**
 * @file backblazeServer.ts
 * @description Local server Backblaze handler and proxy.
 */

export class BackblazeServer {
  public async handleAuth(keyId: string, appKey: string) {
    return { success: true, accountId: keyId, timestamp: Date.now() };
  }
}

export const backblazeServer = new BackblazeServer();
