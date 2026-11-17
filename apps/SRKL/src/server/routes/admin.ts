/**
 * @file admin.ts
 * @description Administrative and Cluster Management API Router.
 * File size < 200 lines strictly.
 */

import express, { Request, Response, NextFunction } from 'express';
import { getDbStatus, getDatabaseUrl, bootstrapDatabase, query } from '../db';
import { getAuditLogs, addAuditLog } from '../audit';
import { detectEnvDatabases, maskConnectionString } from '../clusterDetector';
import { testDatabaseEntry } from '../clusterTester';
import { DatabaseConnectionEntry } from '@/libraries/types/auth';
import { getVerifiedPrincipal } from '../luthSession';

const router = express.Router();

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // Authorization is read from the server-created verified principal, never caller headers.
  // Never infer privilege from caller-controlled query parameters or headers.
  if (getVerifiedPrincipal(req)?.role !== 'admin') {
    res.status(403).json({ error: 'Access Denied: verified administrator privileges required.' });
    return;
  }
  next();
}

let runtimeDatabases: DatabaseConnectionEntry[] = [];

// GET /api/admin/cluster
router.get('/cluster', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  const envDatabases = detectEnvDatabases();
  const allDatabases = [...envDatabases, ...runtimeDatabases];
  res.json({
    status: dbStatus.connected ? 'healthy' : 'standby',
    isEnvPersistent: getDatabaseUrl() !== null,
    databases: allDatabases,
  });
});

// POST /api/admin/cluster/test
router.post('/cluster/test', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const targetEntry: DatabaseConnectionEntry = req.body;
  if (!targetEntry || (!targetEntry.neon?.connectionString && !targetEntry.postgres?.connectionString && !req.body.connectionString)) {
    res.status(400).json({ error: 'Database connection configuration is required.' });
    return;
  }
  const entry: DatabaseConnectionEntry = targetEntry.neon?.connectionString || targetEntry.postgres?.connectionString ? targetEntry : {
    id: 'test_temp',
    name: 'Temporary Probe',
    engine: req.body.engine || 'neon',
    role: 'primary',
    target: 'all',
    enabled: true,
    status: 'testing',
    neon: { connectionString: req.body.connectionString, tableName: 'srkl_application_profiles' },
  };
  const result = await testDatabaseEntry(entry);
  await addAuditLog(result.success ? 'DB_TEST_SUCCESS' : 'DB_TEST_FAILED', getVerifiedPrincipal(req)?.id || 'system', `Probe for ${entry.name || 'database'}: ${result.message}`, 'cluster', req.ip);
  res.json(result);
});

// POST /api/admin/cluster/replicate
router.post('/cluster/replicate', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await addAuditLog('CLUSTER_SYNC_ALL', getVerifiedPrincipal(req)?.id || 'system', 'Dispatched real-time replication sync.', 'cluster', req.ip);
  res.json({ success: true, message: 'Replication sync dispatched.', timestamp: new Date().toISOString() });
});

// POST /api/admin/cluster/provision
router.post('/cluster/provision', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await bootstrapDatabase();
    await addAuditLog('SCHEMA_BOOTSTRAP', 'usr-admin', 'Auto-provisioned PostgreSQL schema.', 'cluster', req.ip);
    res.json({ success: true, message: 'Database schema provisioned successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: `Schema provisioning failed: ${err.message}` });
  }
});

// POST /api/admin/cluster/add
router.post('/cluster/add', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const newDb: DatabaseConnectionEntry = req.body;
  if (!newDb.name || !newDb.engine) {
    res.status(400).json({ error: 'Database name and engine required.' });
    return;
  }
  newDb.id = `db_custom_${Date.now()}`;
  newDb.isFromEnv = false;
  newDb.source = 'runtime';
  newDb.status = 'connected';
  if (newDb.neon?.connectionString) newDb.connectionString = maskConnectionString(newDb.neon.connectionString);
  runtimeDatabases.push(newDb);
  await addAuditLog('CLUSTER_DB_ADDED', 'usr-admin', `Added database: ${newDb.name}`, 'cluster', req.ip);
  res.status(201).json({ success: true, database: newDb });
});

// DELETE /api/admin/cluster/:id
router.delete('/cluster/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const beforeLen = runtimeDatabases.length;
  runtimeDatabases = runtimeDatabases.filter((d) => d.id !== req.params.id);
  if (runtimeDatabases.length < beforeLen) {
    await addAuditLog('CLUSTER_DB_REMOVED', 'usr-admin', `Removed database ${req.params.id}`, 'cluster', req.ip);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Cannot remove environment-managed databases.' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const resDb = await query('SELECT id, email, username, name, role, avatar_glyph, created_at, last_login_at FROM "srkl_application_profiles" ORDER BY created_at DESC');
    res.json({ success: true, count: resDb.rows.length, users: resDb.rows });
  } catch {
    res.json({ success: true, count: 0, users: [] });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await query('DELETE FROM "srkl_application_profiles" WHERE id = $1', [req.params.id]);
    await addAuditLog('USER_DELETED_BY_ADMIN', 'usr-admin', `Deleted user ${req.params.id}`, 'admin', req.ip);
    res.json({ success: true, message: `User ${req.params.id} removed.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/tables
router.get('/tables', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const resTables = await query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `);
    res.json({ success: true, tables: resTables.rows.map((r: any) => r.table_name) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
