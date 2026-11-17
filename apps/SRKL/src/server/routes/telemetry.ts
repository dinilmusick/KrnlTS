/**
 * @file telemetry.ts
 * @description Real-time SSE Telemetry stream and broadcast router.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import {
  registerSseClient,
  unregisterSseClient,
  broadcastTelemetry,
  getConnectedClientCount,
} from '../telemetryBus';
import { createSecureRoute } from '../governance';

const router = express.Router();

// GET /api/telemetry/events (SSE Stream)
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  registerSseClient(res);

  // Send initial connection packet
  res.write(`event: connected\ndata: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  // 30-second periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSseClient(res);
  });
});

// POST /api/telemetry/broadcast
router.post(
  '/broadcast',
  createSecureRoute({
    id: 'telemetry-broadcast',
    method: 'POST',
    public: true,
    rateLimit: { tier: 'NORMAL_MUTATION', requests: 60, windowMs: 60000 },
    handler: (req, _ctx, res) => {
      const { type, payload, serviceId, action } = req.body;
      if (!type) {
        res.status(400).json({ success: false, error: 'Event type is required' });
        return;
      }
      broadcastTelemetry({ type, payload, serviceId, action });
      res.json({ success: true, message: 'Event broadcasted', connectedClients: getConnectedClientCount() });
    },
  })
);

// GET /api/telemetry/status
router.get(
  '/status',
  createSecureRoute({
    id: 'telemetry-status',
    method: 'GET',
    public: true,
    rateLimit: { tier: 'CHEAP_READ', requests: 300, windowMs: 60000 },
    handler: (_req, _ctx, res) => {
      res.json({
        success: true,
        activeSubscribers: getConnectedClientCount(),
        timestamp: new Date().toISOString(),
      });
    },
  })
);

export default router;
