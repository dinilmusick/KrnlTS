/**
 * @file groupsAndTabs.ts
 * @description API Router for Service Groups and Tabs Management.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import {
  getRuntimeGroups,
  setRuntimeGroup,
  removeRuntimeGroup,
  bulkSetRuntimeGroups,
  getRuntimeTabs,
  setRuntimeTab,
  removeRuntimeTab,
  bulkSetRuntimeTabs,
} from '../serverServiceEngine';
import { ServiceGroup, ServiceTab } from '@/libraries/types/srkl';

const router = express.Router();

// --- Groups Endpoints ---

router.get('/groups', (_req: Request, res: Response) => {
  const groups = getRuntimeGroups();
  res.json({ success: true, count: groups.length, groups });
});

router.post('/groups', (req: Request, res: Response): void => {
  const group: ServiceGroup = req.body.group || req.body;
  if (!group?.name) {
    res.status(400).json({ success: false, error: 'Group name is required' });
    return;
  }
  const id = group.id || `grp-${Date.now().toString(36)}`;
  const savedGroup: ServiceGroup = { ...group, id };
  setRuntimeGroup(savedGroup);
  res.status(201).json({ success: true, group: savedGroup });
});

router.put('/groups/:id', (req: Request, res: Response): void => {
  const partial = req.body.group || req.body;
  const groups = getRuntimeGroups();
  const existing = groups.find((g) => g.id === req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'Group not found' });
    return;
  }
  const updatedGroup: ServiceGroup = { ...existing, ...partial, id: req.params.id };
  setRuntimeGroup(updatedGroup);
  res.json({ success: true, group: updatedGroup });
});

router.delete('/groups/:id', (req: Request, res: Response): void => {
  const removed = removeRuntimeGroup(req.params.id);
  res.json({ success: removed, message: removed ? 'Group removed' : 'Group not found' });
});

router.post('/groups/bulk', (req: Request, res: Response): void => {
  const { groups } = req.body;
  if (!Array.isArray(groups)) {
    res.status(400).json({ success: false, error: 'groups array required' });
    return;
  }
  bulkSetRuntimeGroups(groups);
  res.json({ success: true, count: groups.length, groups });
});

// --- Tabs Endpoints ---

router.get('/tabs', (_req: Request, res: Response) => {
  const tabs = getRuntimeTabs();
  res.json({ success: true, count: tabs.length, tabs });
});

router.post('/tabs', (req: Request, res: Response): void => {
  const tab: ServiceTab = req.body.tab || req.body;
  if (!tab?.name) {
    res.status(400).json({ success: false, error: 'Tab name is required' });
    return;
  }
  const id = tab.id || `tab-${Date.now().toString(36)}`;
  const savedTab: ServiceTab = { ...tab, id, groupIds: tab.groupIds || [] };
  setRuntimeTab(savedTab);
  res.status(201).json({ success: true, tab: savedTab });
});

router.put('/tabs/:id', (req: Request, res: Response): void => {
  const partial = req.body.tab || req.body;
  const tabs = getRuntimeTabs();
  const existing = tabs.find((t) => t.id === req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'Tab not found' });
    return;
  }
  const updatedTab: ServiceTab = { ...existing, ...partial, id: req.params.id };
  setRuntimeTab(updatedTab);
  res.json({ success: true, tab: updatedTab });
});

router.delete('/tabs/:id', (req: Request, res: Response): void => {
  const removed = removeRuntimeTab(req.params.id);
  res.json({ success: removed, message: removed ? 'Tab removed' : 'Tab not found' });
});

router.post('/tabs/bulk', (req: Request, res: Response): void => {
  const { tabs } = req.body;
  if (!Array.isArray(tabs)) {
    res.status(400).json({ success: false, error: 'tabs array required' });
    return;
  }
  bulkSetRuntimeTabs(tabs);
  res.json({ success: true, count: tabs.length, tabs });
});

export default router;
