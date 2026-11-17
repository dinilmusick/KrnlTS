/** @file Service execution and bundle exchange using workspace-vault accounts only. */

import express, { Request, Response } from 'express';
import { getVerifiedPrincipal } from '../luthSession';
import { executeServerAction, executeServerEndpoint, getServerRegistry, getDefinitionById, registerServerDefinition } from '../serverServiceEngine';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { EndpointDefinition, ServiceDefinition } from '@/libraries/types/srkl';
import { getWorkspaceVault, flushWorkspaceVault } from '../storage/workspaceVaultCoordinator';

const router = express.Router();
const getUserId = (req: Request): string => getVerifiedPrincipal(req)?.id || '';

async function getVaultAccount(req: Request, accountId?: string): Promise<ServiceAccount | undefined> {
  if (!accountId) return undefined;
  const userId = getUserId(req);
  if (!userId) throw new Error('A logged-in user ID is required to access a service account.');
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query.workspaceId as string) || req.body?.workspaceId;
  const { manager } = await getWorkspaceVault(userId, workspaceId);
  const account = manager.getServiceAccounts().find((item) => item.id === accountId);
  if (!account) throw new Error('Service account not found in the active workspace vault.');
  return new ServiceAccount(account);
}

router.post('/execute-action', async (req: Request, res: Response): Promise<void> => {
  const { serviceId, actionId, accountId, payload } = req.body;
  if (!serviceId || !actionId) { res.status(400).json({ success: false, error: 'serviceId and actionId are required' }); return; }
  try {
    const result = await executeServerAction(serviceId, actionId, payload || {}, await getVaultAccount(req, accountId), getUserId(req) || 'agent-api');
    res.json({ success: true, serviceId, actionId, result });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message || 'Action execution failed' }); }
});

router.post('/execute-endpoint', async (req: Request, res: Response): Promise<void> => {
  const { serviceId, endpoint, pathParams, queryParams, headers, body, accountId, account: accountData } = req.body;
  if (!serviceId || !endpoint) { res.status(400).json({ success: false, error: 'serviceId and endpoint definition are required' }); return; }
  try {
    const account = await getVaultAccount(req, accountId) || (accountData ? new ServiceAccount(accountData) : undefined);
    const result = await executeServerEndpoint(endpoint as EndpointDefinition, serviceId, { pathParams: pathParams || {}, queryParams: queryParams || {}, headers: headers || {}, body }, account);
    res.json(result);
  } catch (err: any) { res.status(500).json({ success: false, error: err.message || 'Endpoint execution failed' }); }
});

router.get('/accounts/:id/resources', async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await getVaultAccount(req, req.params.id);
    const provider = account && getServerRegistry().get(account.serviceId);
    if (!provider) { res.status(404).json({ success: false, error: 'Service account or provider not found' }); return; }
    const resources = await provider.listResources(account, req.query.parentId as string | undefined);
    res.json({ success: true, count: resources.length, resources: resources.map((item) => item.toJSON()) });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/accounts/:id/resources/:resourceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await getVaultAccount(req, req.params.id);
    const provider = account && getServerRegistry().get(account.serviceId);
    if (!provider) { res.status(404).json({ success: false, error: 'Service account or provider not found' }); return; }
    const resource = await provider.getResource(account, req.params.resourceId);
    if (!resource) { res.status(404).json({ success: false, error: 'Resource not found' }); return; }
    res.json({ success: true, resource: resource.toJSON() });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/export', async (req: Request, res: Response): Promise<void> => {
  const { serviceId, accountId } = req.body;
  if (!serviceId) { res.status(400).json({ success: false, error: 'serviceId is required for export' }); return; }
  const definition = getDefinitionById(serviceId);
  if (!definition) { res.status(404).json({ success: false, error: `Service definition "${serviceId}" not found` }); return; }
  try {
    const account = await getVaultAccount(req, accountId);
    res.json({ success: true, bundle: { schemaVersion: '1.0.0', exportedAt: new Date().toISOString(), serviceDefinition: definition, serviceAccount: account?.toJSON() || null } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/import', async (req: Request, res: Response): Promise<void> => {
  const { bundle, workspaceId } = req.body;
  if (!bundle?.serviceDefinition) { res.status(400).json({ success: false, error: 'Invalid bundle format. serviceDefinition is required.' }); return; }
  const definition: ServiceDefinition = bundle.serviceDefinition;
  registerServerDefinition(definition);
  try {
    if (bundle.serviceAccount) {
      const userId = getUserId(req);
      if (!userId) throw new Error('A logged-in user ID is required to import a service account.');
      const targetWorkspaceId = workspaceId || (req.headers['x-workspace-id'] as string);
      const { manager } = await getWorkspaceVault(userId, targetWorkspaceId);
      manager.upsertServiceAccount(bundle.serviceAccount);
      await flushWorkspaceVault(userId, targetWorkspaceId);
    }
    res.status(201).json({ success: true, definition });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
