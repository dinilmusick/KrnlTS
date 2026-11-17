/**
 * @file backblazeAuthHelper.ts
 * @description Authentication and SSE Client management for Backblaze B2.
 * File size < 200 lines strictly.
 */

import { Response } from 'express';
import { BackblazeClient, B2AuthData } from '../backblazeClient';

const authCache = new Map<string, { auth: B2AuthData; timestamp: number }>();
const sseClients = new Set<Response>();

export function broadcastB2Event(event: Record<string, any>): void {
  const payload = `data: ${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function registerB2SseClient(res: Response): void {
  sseClients.add(res);
}

export function unregisterB2SseClient(res: Response): void {
  sseClients.delete(res);
}

export function invalidateB2Cache(keyId: string, applicationKey: string): void {
  authCache.delete(`${keyId}:${applicationKey}`);
}

export async function getOrAuthenticate(keyId: string, applicationKey: string): Promise<B2AuthData> {
  const cacheKey = `${keyId}:${applicationKey}`;
  const cached = authCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 20 * 60 * 1000) return cached.auth;
  const auth = await BackblazeClient.authorize(keyId, applicationKey);
  authCache.set(cacheKey, { auth, timestamp: Date.now() });
  return auth;
}
