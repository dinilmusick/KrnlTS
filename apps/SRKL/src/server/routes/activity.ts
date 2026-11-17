/**
 * @file activity.ts
 * @description API Router for Activity Logging and Surveillance History.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import { ActivityRecord } from '@/libraries/types/srkl';
import { broadcastTelemetry } from '../telemetryBus';

const inMemoryActivityLogs: ActivityRecord[] = [];

export function getStoredActivityLogs(): ActivityRecord[] {
  return inMemoryActivityLogs;
}

export function recordActivityLog(log: ActivityRecord): void {
  inMemoryActivityLogs.unshift(log);
  if (inMemoryActivityLogs.length > 200) {
    inMemoryActivityLogs.pop();
  }
  broadcastTelemetry({ type: 'ACTIVITY_LOGGED', payload: log });
}

const router = express.Router();

// GET /api/activity
router.get('/', (req: Request, res: Response) => {
  const { serviceId, status, limit } = req.query;
  let filtered = [...inMemoryActivityLogs];
  if (serviceId && typeof serviceId === 'string') {
    filtered = filtered.filter((l) => l.serviceId === serviceId);
  }
  if (status && typeof status === 'string') {
    filtered = filtered.filter((l) => l.status === status);
  }
  const maxLimit = limit ? parseInt(limit as string, 10) : 50;
  res.json({
    success: true,
    count: filtered.slice(0, maxLimit).length,
    total: filtered.length,
    logs: filtered.slice(0, maxLimit),
  });
});

// POST /api/activity
router.post('/', (req: Request, res: Response): void => {
  const body = req.body;
  if (!body.serviceId || !body.actionId) {
    res.status(400).json({ success: false, error: 'serviceId and actionId are required' });
    return;
  }
  const newRecord: ActivityRecord = {
    id: body.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: body.timestamp || new Date().toISOString(),
    serviceId: body.serviceId,
    serviceName: body.serviceName || body.serviceId,
    accountId: body.accountId,
    accountName: body.accountName,
    resourceId: body.resourceId,
    resourceName: body.resourceName,
    actionId: body.actionId,
    actionType: body.actionType || 'EXECUTE',
    status: body.status || 'SUCCESS',
    durationMs: body.durationMs || 0,
    error: body.error || null,
    details: body.details || {},
  };

  recordActivityLog(newRecord);
  res.status(201).json({ success: true, log: newRecord });
});

// DELETE /api/activity
router.delete('/', (_req: Request, res: Response) => {
  inMemoryActivityLogs.length = 0;
  broadcastTelemetry({ type: 'ACTIVITY_CLEARED' });
  res.json({ success: true, message: 'Activity logs cleared' });
});

export default router;
