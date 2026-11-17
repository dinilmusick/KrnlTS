/**
 * ASCII Architecture Flowchart: presetRoutes
 *
 *   ┌──────────────────────────────────────────────┐
 *   │      Initialize Intelligence & Pref Routes   │
 *   └──────────────────────────────────────────────┘
 *                          │
 *                          ▼
 *   ┌──────────────────────────────────────────────┐
 *   │  Intelligence Specs CRUD (Presets & Tensors) │
 *   └──────────────────────────────────────────────┘
 *                          │
 *                          ▼
 *   ┌──────────────────────────────────────────────┐
 *   │  Preferences Specs CRUD (Latency/Cost/Prov)  │
 *   └──────────────────────────────────────────────┘
 */

import { Router, Request, Response } from 'express';
import { dbStore } from '../dbStore.js';
import { IntelligenceSpecPreset, PreferencesSpecPreset } from '../intelligence/types.js';

export const presetRouter = Router();

function requireAdmin(req: Request, res: Response, next: any) {
  if ((req as any).aikoPrincipal?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Administrator access is required.' });
  }
  next();
}

// ════ INTELLIGENCE SPECS (PRESETS) ═════════════════════════════════════════════════

function handleListIntelPresets(_req: Request, res: Response) {
  res.json({ success: true, presets: dbStore.loadPresets() });
}

function handleGetIntelPreset(req: Request, res: Response) {
  const preset = dbStore.getPresetById(req.params.id);
  if (!preset) return res.status(404).json({ success: false, error: 'Intelligence spec preset not found.' });
  res.json({ success: true, preset });
}

function handleSaveIntelPreset(req: Request, res: Response) {
  const { id, name, description, sigilId, tensor, prioritiseReasoning, prioritiseDeterminism, avoidPaidProviders, isDefault } = req.body;
  const targetId = req.params.id || id || `preset-custom-${Date.now()}`;
  if (!name || !sigilId || !tensor) {
    return res.status(400).json({ success: false, error: 'Name, sigilId, and 15-parameter tensor are required.' });
  }

  const payload: IntelligenceSpecPreset = {
    id: targetId,
    name,
    description: description || '',
    sigilId,
    tensor,
    prioritiseReasoning: Boolean(prioritiseReasoning),
    prioritiseDeterminism: Boolean(prioritiseDeterminism),
    avoidPaidProviders: Boolean(avoidPaidProviders),
    isDefault: Boolean(isDefault),
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const saved = dbStore.savePreset(payload);
  res.status(201).json({ success: true, preset: saved, presets: dbStore.loadPresets() });
}

function handleDeleteIntelPreset(req: Request, res: Response) {
  const ok = dbStore.deletePreset(req.params.id);
  res.json({ success: ok, presets: dbStore.loadPresets() });
}

function handleResetIntelPresets(_req: Request, res: Response) {
  const presets = dbStore.resetPresetsToDefault();
  res.json({ success: true, message: 'Intelligence specs reset to default.', presets });
}

presetRouter.get('/presets', handleListIntelPresets);
presetRouter.get('/presets/:id', handleGetIntelPreset);
presetRouter.post('/presets', requireAdmin, handleSaveIntelPreset);
presetRouter.put('/presets/:id', requireAdmin, handleSaveIntelPreset);
presetRouter.delete('/presets/:id', requireAdmin, handleDeleteIntelPreset);
presetRouter.post('/presets/reset', requireAdmin, handleResetIntelPresets);

presetRouter.get('/intelligence-specs', handleListIntelPresets);
presetRouter.get('/intelligence-specs/:id', handleGetIntelPreset);
presetRouter.post('/intelligence-specs', requireAdmin, handleSaveIntelPreset);
presetRouter.put('/intelligence-specs/:id', requireAdmin, handleSaveIntelPreset);
presetRouter.delete('/intelligence-specs/:id', requireAdmin, handleDeleteIntelPreset);
presetRouter.post('/intelligence-specs/reset', requireAdmin, handleResetIntelPresets);

// ════ PREFERENCES SPECS (PRESETS) ══════════════════════════════════════════════════

function handleListPrefPresets(_req: Request, res: Response) {
  res.json({ success: true, presets: dbStore.loadPreferencesPresets() });
}

function handleGetPrefPreset(req: Request, res: Response) {
  const preset = dbStore.getPreferencesPresetById(req.params.id);
  if (!preset) return res.status(404).json({ success: false, error: 'Preferences spec preset not found.' });
  res.json({ success: true, preset });
}

function handleSavePrefPreset(req: Request, res: Response) {
  const { id, name, description, sigilId, isDefault, ...filterFields } = req.body;
  const targetId = req.params.id || id || `pref-preset-${Date.now()}`;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required.' });

  const payload: PreferencesSpecPreset = {
    id: targetId,
    name,
    description: description || '',
    sigilId: sigilId || 'SigilBolt',
    isDefault: Boolean(isDefault),
    ...filterFields,
    updatedAt: new Date().toISOString()
  };

  const saved = dbStore.savePreferencesPreset(payload);
  res.status(201).json({ success: true, preset: saved, presets: dbStore.loadPreferencesPresets() });
}

function handleDeletePrefPreset(req: Request, res: Response) {
  const ok = dbStore.deletePreferencesPreset(req.params.id);
  res.json({ success: ok, presets: dbStore.loadPreferencesPresets() });
}

function handleResetPrefPresets(_req: Request, res: Response) {
  const presets = dbStore.resetPreferencesPresetsToDefault();
  res.json({ success: true, message: 'Preferences presets reset to default.', presets });
}

presetRouter.get('/preferences-presets', handleListPrefPresets);
presetRouter.get('/preferences-presets/:id', handleGetPrefPreset);
presetRouter.post('/preferences-presets', requireAdmin, handleSavePrefPreset);
presetRouter.put('/preferences-presets/:id', requireAdmin, handleSavePrefPreset);
presetRouter.delete('/preferences-presets/:id', requireAdmin, handleDeletePrefPreset);
presetRouter.post('/preferences-presets/reset', requireAdmin, handleResetPrefPresets);

presetRouter.get('/preference-specs', handleListPrefPresets);
presetRouter.get('/preference-specs/:id', handleGetPrefPreset);
presetRouter.post('/preference-specs', requireAdmin, handleSavePrefPreset);
presetRouter.put('/preference-specs/:id', requireAdmin, handleSavePrefPreset);
presetRouter.delete('/preference-specs/:id', requireAdmin, handleDeletePrefPreset);
presetRouter.post('/preference-specs/reset', requireAdmin, handleResetPrefPresets);
