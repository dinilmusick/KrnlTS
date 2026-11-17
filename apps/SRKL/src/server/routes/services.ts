/**
 * @file services.ts
 * @description REST API Router for Services, Definitions, Accounts, and Surveillance.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import {
  getAllDefinitions,
  getDefinitionById,
  registerServerDefinition,
  removeServerDefinition,
} from '../serverServiceEngine';
import { ServiceRegistry } from '@/libraries/services/registry';

const router = express.Router();

// Definitions
router.get('/definitions', (_req: Request, res: Response) => {
  const definitions = getAllDefinitions();
  res.json({ success: true, count: definitions.length, definitions });
});

router.get('/definitions/:identifier', (req: Request, res: Response): void => {
  const def = getDefinitionById(req.params.identifier);
  if (!def) { res.status(404).json({ success: false, error: 'Definition not found' }); return; }
  res.json({ success: true, definition: def });
});

router.post('/definitions', (req: Request, res: Response): void => {
  const def = req.body.definition || req.body;
  if (!def?.identifier || !def?.name) {
    res.status(400).json({ success: false, error: 'identifier and name are required.' });
    return;
  }
  res.status(201).json({ success: true, definition: registerServerDefinition(def) });
});

router.put('/definitions/:identifier', (req: Request, res: Response): void => {
  const def = req.body.definition || req.body;
  if (!def?.name) { res.status(400).json({ success: false, error: 'Invalid definition data' }); return; }
  def.identifier = req.params.identifier;
  res.json({ success: true, definition: registerServerDefinition(def) });
});

router.delete('/definitions/:identifier', (req: Request, res: Response): void => {
  const removed = removeServerDefinition(req.params.identifier);
  res.json({ success: removed, message: removed ? 'Definition removed' : 'Definition not found' });
});

// Templates
router.get('/templates', (_req: Request, res: Response) => {
  const templates = ServiceRegistry.getAvailableTemplates();
  res.json({ success: true, count: templates.length, templates });
});

router.post('/templates/instantiate', (req: Request, res: Response): void => {
  const { templateId } = req.body;
  const template = ServiceRegistry.getAvailableTemplates().find((t) => t.identifier === templateId);
  if (!template) { res.status(404).json({ success: false, error: `Template "${templateId}" not found` }); return; }
  registerServerDefinition(template);
  res.status(201).json({ success: true, definition: template });
});

export default router;
