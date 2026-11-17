/**
 * @file sqliteWorkspaceManager.ts
 * @description WebAssembly SQLite Manager for SRKL Workspace Vault.
 * Uses sql.js for pure memory-first, zero-compilation local ACID execution.
 * File size strictly < 200 lines.
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

let sqlInstance: SqlJsStatic | null = null;

async function getSqlEngine(): Promise<SqlJsStatic> {
  if (sqlInstance) return sqlInstance;
  const taskRoot = '/var/task';
  const candidates = [
    path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
    path.resolve(taskRoot, 'node_modules/sql.js/dist/sql-wasm.wasm'),
    ...(typeof __dirname !== 'undefined' ? [path.resolve(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm')] : []),
  ];
  let wasmBinary: Buffer | undefined;
  const found = candidates.find((c) => { try { return fs.existsSync(c); } catch { return false; } });
  if (found) { try { wasmBinary = fs.readFileSync(found); } catch {} }
  if (!wasmBinary) {
    try {
      const { systemBucketDownload } = await import('../system-bucket');
      const res = await systemBucketDownload('srkl/binaries/sql-wasm.wasm');
      if (res?.body && res.body.length > 0) wasmBinary = Buffer.from(res.body);
    } catch {}
  }
  if (!wasmBinary && typeof fetch === 'function') {
    try {
      const resp = await fetch('https://sql.js.org/dist/sql-wasm.wasm');
      if (resp.ok) wasmBinary = Buffer.from(await resp.arrayBuffer());
    } catch {}
  }
  sqlInstance = await initSqlJs(wasmBinary ? { wasmBinary } : {});
  return sqlInstance!;
}

export class SqliteWorkspaceManager {
  private db: Database;
  public isDirty = false;
  private constructor(db: Database) { this.db = db; }

  public static async init(buffer?: Uint8Array | Buffer): Promise<SqliteWorkspaceManager> {
    const engine = await getSqlEngine();
    const db = buffer && buffer.length > 0 ? new engine.Database(buffer) : new engine.Database();
    const manager = new SqliteWorkspaceManager(db);
    manager.bootstrapSchema();
    return manager;
  }

  public bootstrapSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS srkl_meta (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS srkl_services (id TEXT PRIMARY KEY, service_id TEXT NOT NULL, name TEXT NOT NULL, definition_json TEXT, status TEXT DEFAULT 'active', enabled INTEGER DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS srkl_service_accounts (id TEXT PRIMARY KEY, service_id TEXT NOT NULL, name TEXT NOT NULL, credentials_json TEXT NOT NULL, status TEXT DEFAULT 'configured', last_sync TEXT, metadata_json TEXT, group_id TEXT, group_ids_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS srkl_custom_definitions (identifier TEXT PRIMARY KEY, name TEXT NOT NULL, definition_json TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS srkl_groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, color TEXT, icon TEXT, is_default INTEGER DEFAULT 0, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS srkl_tabs (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, group_ids_json TEXT, is_default INTEGER DEFAULT 0, created_at TEXT NOT NULL);
    `);
    try { this.db.run('ALTER TABLE srkl_service_accounts ADD COLUMN group_id TEXT'); this.db.run('ALTER TABLE srkl_service_accounts ADD COLUMN group_ids_json TEXT'); } catch {}
  }

  public getServiceAccounts(): any[] {
    const res = this.db.exec('SELECT * FROM srkl_service_accounts ORDER BY updated_at DESC');
    if (!res.length) return [];
    const { columns, values } = res[0];
    return values.map((row) => {
      const e: any = {};
      columns.forEach((col, i) => { e[col] = row[i]; });
      let creds = {}, meta = {}, gIds: string[] = [];
      try { creds = JSON.parse(e.credentials_json || '{}'); } catch {}
      try { meta = JSON.parse(e.metadata_json || '{}'); } catch {}
      try { gIds = JSON.parse(e.group_ids_json || '[]'); } catch {}
      if (!gIds.length && e.group_id) gIds = [e.group_id];
      return { id: e.id, serviceId: e.service_id, name: e.name, credentials: creds, status: e.status, lastSync: e.last_sync, groupId: e.group_id || gIds[0], groupIds: gIds, metadata: meta, createdAt: e.created_at, updatedAt: e.updated_at };
    });
  }

  public upsertServiceAccount(account: any): void {
    const now = new Date().toISOString();
    const credsJson = JSON.stringify(account.credentials || {});
    const metaJson = JSON.stringify(account.metadata || {});
    const gIds = Array.isArray(account.groupIds) ? account.groupIds : (account.groupId ? [account.groupId] : []);
    const gId = account.groupId || gIds[0] || null;
    const gIdsJson = JSON.stringify(gIds);
    const existing = this.db.exec(`SELECT id FROM srkl_service_accounts WHERE id = '${account.id.replace(/'/g, "''")}'`);

    if (existing.length > 0 && existing[0].values.length > 0) {
      this.db.run(`UPDATE srkl_service_accounts SET name = ?, credentials_json = ?, status = ?, metadata_json = ?, group_id = ?, group_ids_json = ?, updated_at = ? WHERE id = ?`, [account.name || account.serviceId, credsJson, account.status || 'configured', metaJson, gId, gIdsJson, now, account.id]);
    } else {
      this.db.run(`INSERT INTO srkl_service_accounts (id, service_id, name, credentials_json, status, metadata_json, group_id, group_ids_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [account.id, account.serviceId, account.name || account.serviceId, credsJson, account.status || 'configured', metaJson, gId, gIdsJson, account.createdAt || now, now]);
    }
    this.isDirty = true;
  }

  public deleteServiceAccount(id: string): boolean {
    this.db.run('DELETE FROM srkl_service_accounts WHERE id = ?', [id]);
    this.isDirty = true;
    return true;
  }

  public getGroups(): any[] {
    const res = this.db.exec('SELECT * FROM srkl_groups ORDER BY created_at ASC');
    if (!res.length) return [];
    const { columns, values } = res[0];
    return values.map((r) => {
      const e: any = {};
      columns.forEach((c, i) => { e[c] = r[i]; });
      return { id: e.id, name: e.name, description: e.description || '', color: e.color || 'neutral', icon: e.icon || 'Layers', isDefault: Boolean(e.is_default), createdAt: e.created_at };
    });
  }

  public upsertGroup(g: any): void {
    const now = new Date().toISOString();
    const existing = this.db.exec(`SELECT id FROM srkl_groups WHERE id = '${g.id.replace(/'/g, "''")}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      this.db.run('UPDATE srkl_groups SET name = ?, description = ?, color = ?, icon = ?, is_default = ? WHERE id = ?', [g.name, g.description || '', g.color || 'neutral', g.icon || 'Layers', g.isDefault ? 1 : 0, g.id]);
    } else {
      this.db.run('INSERT INTO srkl_groups (id, name, description, color, icon, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [g.id, g.name, g.description || '', g.color || 'neutral', g.icon || 'Layers', g.isDefault ? 1 : 0, g.createdAt || now]);
    }
    this.isDirty = true;
  }

  public deleteGroup(id: string): void {
    this.db.run('DELETE FROM srkl_groups WHERE id = ?', [id]);
    this.isDirty = true;
  }

  public getTabs(): any[] {
    const res = this.db.exec('SELECT * FROM srkl_tabs ORDER BY created_at ASC');
    if (!res.length) return [];
    const { columns, values } = res[0];
    return values.map((r) => {
      const e: any = {};
      columns.forEach((c, i) => { e[c] = r[i]; });
      let groupIds: string[] = [];
      try { groupIds = JSON.parse(e.group_ids_json || '[]'); } catch {}
      return { id: e.id, name: e.name, description: e.description || '', groupIds, isDefault: Boolean(e.is_default), createdAt: e.created_at };
    });
  }

  public upsertTab(t: any): void {
    const now = new Date().toISOString();
    const existing = this.db.exec(`SELECT id FROM srkl_tabs WHERE id = '${t.id.replace(/'/g, "''")}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      this.db.run('UPDATE srkl_tabs SET name = ?, description = ?, group_ids_json = ?, is_default = ? WHERE id = ?', [t.name, t.description || '', JSON.stringify(t.groupIds || []), t.isDefault ? 1 : 0, t.id]);
    } else {
      this.db.run('INSERT INTO srkl_tabs (id, name, description, group_ids_json, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)', [t.id, t.name, t.description || '', JSON.stringify(t.groupIds || []), t.isDefault ? 1 : 0, t.createdAt || now]);
    }
    this.isDirty = true;
  }

  public deleteTab(id: string): void {
    this.db.run('DELETE FROM srkl_tabs WHERE id = ?', [id]);
    this.isDirty = true;
  }

  public getCustomDefinitions(): any[] {
    const res = this.db.exec('SELECT * FROM srkl_custom_definitions ORDER BY created_at DESC');
    if (res.length === 0) return [];
    const { columns, values } = res[0];
    return values.map((row) => {
      const entry: any = {};
      columns.forEach((col, i) => { entry[col] = row[i]; });
      try { return JSON.parse(entry.definition_json); } catch { return null; }
    }).filter(Boolean);
  }

  public upsertCustomDefinition(def: any): void {
    const now = new Date().toISOString();
    const id = def.identifier || def.id;
    const jsonStr = JSON.stringify(def);
    const existing = this.db.exec(`SELECT identifier FROM srkl_custom_definitions WHERE identifier = '${id.replace(/'/g, "''")}'`);
    const isUpdate = existing.length > 0 && existing[0].values.length > 0;
    const query = isUpdate ? 'UPDATE srkl_custom_definitions SET name = ?, definition_json = ? WHERE identifier = ?' : 'INSERT INTO srkl_custom_definitions (name, definition_json, identifier, created_at) VALUES (?, ?, ?, ?)';
    const params = isUpdate ? [def.name, jsonStr, id] : [def.name, jsonStr, id, now];
    this.db.run(query, params);
    this.isDirty = true;
  }

  public deleteCustomDefinition(identifier: string): boolean {
    this.db.run('DELETE FROM srkl_custom_definitions WHERE identifier = ?', [identifier]);
    this.isDirty = true;
    return true;
  }

  public exportBinary(): Uint8Array {
    return this.db.export();
  }

  public close(): void {
    this.db.close();
  }
}
