/**
 * @file settings.ts
 * @description API Router for Hub User and Workspace Settings.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import { getRuntimeSettings, updateRuntimeSettings } from '../serverServiceEngine';

const router = express.Router();

// GET /api/settings
router.get('/', (_req: Request, res: Response) => {
  const settings = getRuntimeSettings();
  res.json({ success: true, settings });
});

// PUT /api/settings
router.put('/', (req: Request, res: Response): void => {
  const partial = req.body.settings || req.body;
  if (!partial || typeof partial !== 'object') {
    res.status(400).json({ success: false, error: 'Settings object is required' });
    return;
  }
  const updated = updateRuntimeSettings(partial);
  res.json({ success: true, settings: updated });
});

export default router;
