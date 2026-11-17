/**
 * @file telemetryBus.ts
 * @description In-memory real-time SSE stream dispatcher for SRKL.
 * Broadcasts telemetry, actions, service mutations, and activity events.
 * File size < 200 lines strictly.
 */

import { Response } from 'express';

export interface TelemetryEvent {
  type: string;
  domain?: string;
  action?: string;
  serviceId?: string;
  accountId?: string;
  userId?: string;
  payload?: unknown;
  timestamp?: string;
}

const sseClients = new Set<Response>();

export function registerSseClient(res: Response): void {
  sseClients.add(res);
  const welcomePayload = `data: ${JSON.stringify({
    type: 'TELEMETRY_CONNECTED',
    timestamp: new Date().toISOString(),
    connectedClients: sseClients.size,
  })}\n\n`;
  try {
    res.write(welcomePayload);
  } catch {
    sseClients.delete(res);
  }
}

export function unregisterSseClient(res: Response): void {
  sseClients.delete(res);
}

export function broadcastTelemetry(event: TelemetryEvent): void {
  const fullEvent = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };
  const payload = `data: ${JSON.stringify(fullEvent)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function getConnectedClientCount(): number {
  return sseClients.size;
}
