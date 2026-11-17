// ══════════════════════════════════════════════════════════════════════════════════
// ════ API ROUTE HELPERS & SETUP FUNCTIONS ═════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { keyStore } from '../keyStore.js';
import { dbStore } from '../dbStore.js';
import { modelHealthService } from '../intelligence/modelHealthService.js';

// ════ KEY ROUTES SETUP ═════════════════════════════════════════════════════════════
export function setupKeyRoutes(router: Router) {
  router.get('/keys', (req, res) => {
    const keyId = req.query.keyId as string | undefined;
    const modelId = req.query.modelId as string | undefined;
    const providerId = (req.query.providerId as any) || 'google';
    const nextKey = keyStore.peekNextKey(providerId, modelId);
    res.json({
      success: true,
      keys: keyStore.getKeys(),
      strategy: keyStore.getStrategy(),
      nextKeyId: nextKey?.id || null,
      permanentKeyId: keyStore.getPermanentKey(providerId) || null,
      permanentKeys: keyStore.getPermanentKeysMap(),
      usageStats: dbStore.getAllKeyModelUsageStats()
    });
  });

  router.get('/keys/next', (req, res) => {
    const providerId = (req.query.providerId as any) || 'google';
    const modelId = req.query.modelId as string | undefined;
    const nextKey = keyStore.peekNextKey(providerId, modelId);
    res.json({ success: true, nextKeyId: nextKey?.id || null, nextKey });
  });

  router.get('/keys/usage', (req, res) => {
    const keyId = req.query.keyId as string | undefined;
    const modelId = req.query.modelId as string | undefined;
    res.json({ success: true, usageStats: dbStore.getKeyModelUsageStats(keyId, modelId) });
  });

  router.post('/keys', async (req, res) => {
    const { providerId, label, key, weight } = req.body;
    if (!providerId || !label || !key) return res.status(400).json({ success: false, error: 'Missing fields' });
    const entry = await keyStore.addKey({ providerId, label, key, weight: weight || 5 });
    res.json({ success: true, key: entry });
  });

  router.post('/keys/:id/verify', async (req, res) => {
    const updatedKey = await keyStore.verifyKey(req.params.id);
    if (!updatedKey) return res.status(404).json({ success: false, error: 'Key not found.' });
    res.json({ success: true, key: updatedKey });
  });

  router.post('/keys/:id/set-next', (req, res) => {
    const keyId = req.params.id;
    const key = keyStore.getKeys().find(k => k.id === keyId);
    if (!key) return res.status(404).json({ success: false, error: 'Key not found.' });
    keyStore.setForcedNextKey(key.providerId, keyId);
    res.json({ success: true, keyId, providerId: key.providerId, key });
  });

  router.post('/keys/:id/set-permanent', (req, res) => {
    const keyId = req.params.id;
    const key = keyStore.getKeys().find(k => k.id === keyId);
    if (!key) return res.status(404).json({ success: false, error: 'Key not found.' });
    const currentPerm = keyStore.getPermanentKey(key.providerId);
    if (currentPerm === keyId) {
      keyStore.setPermanentKey(key.providerId, null);
      res.json({ success: true, keyId, providerId: key.providerId, isPermanent: false, permanentKeyId: null });
    } else {
      keyStore.setPermanentKey(key.providerId, keyId);
      res.json({ success: true, keyId, providerId: key.providerId, isPermanent: true, permanentKeyId: keyId });
    }
  });

  router.put('/keys/:id/status', (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Missing status' });
    keyStore.updateKeyStatus(req.params.id, status);
    res.json({ success: true, key: keyStore.getKeys().find(k => k.id === req.params.id) });
  });

  router.put('/keys/:id', (req, res) => {
    const { label } = req.body;
    if (!label) return res.status(400).json({ success: false, error: 'Missing label' });
    const updatedKey = keyStore.updateKeyLabel(req.params.id, label);
    if (!updatedKey) return res.status(404).json({ success: false, error: 'Key not found.' });
    res.json({ success: true, key: updatedKey });
  });

  router.post('/keys/reset-all-failures', (req, res) => {
    res.json({ success: true, keys: keyStore.resetAllFailures(), message: 'All key failure states reset.' });
  });

  router.post('/keys/:id/reset-probabilities', (req, res) => {
    const updatedKey = keyStore.resetKeyProbabilities(req.params.id);
    if (!updatedKey) return res.status(404).json({ success: false, error: 'Key not found.' });
    res.json({ success: true, key: updatedKey, keys: keyStore.getKeys() });
  });

  router.post('/keys/:id/check-models', async (req, res) => {
    try {
      const results = await modelHealthService.checkKeyModels(req.params.id);
      res.json({ success: true, results, keys: keyStore.getKeys() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  router.delete('/keys/:id', (req, res) => {
    keyStore.deleteKey(req.params.id);
    res.json({ success: true, message: `Key ${req.params.id} deleted.` });
  });
}

// ════ PRESET ROUTES SETUP ══════════════════════════════════════════════════════════
export function setupPresetRoutes(router: Router) {
  router.get('/presets', (req, res) => res.json({ success: true, presets: dbStore.loadPresets() }));
  router.get('/presets/:id', (req, res) => {
    const preset = dbStore.getPresetById(req.params.id);
    if (!preset) return res.status(404).json({ success: false, error: 'Preset not found.' });
    res.json({ success: true, preset });
  });
  router.post('/presets', (req, res) => {
    const { id, name, description, sigilId, tensor, prioritiseReasoning, prioritiseDeterminism, avoidPaidProviders, isDefault } = req.body;
    if (!name || !sigilId || !tensor) return res.status(400).json({ success: false, error: 'Missing required fields.' });
    const saved = dbStore.savePreset({
      id: id || `preset-custom-${Date.now()}`,
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
    });
    res.json({ success: true, preset: saved, presets: dbStore.loadPresets() });
  });
  router.delete('/presets/:id', (req, res) => {
    res.json({ success: dbStore.deletePreset(req.params.id), presets: dbStore.loadPresets() });
  });
}
