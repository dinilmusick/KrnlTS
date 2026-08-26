/**
 * @file test_universal_backend.js
 * @description Comprehensive verification test for KrnlTS Universal Backend Architecture
 */

import {
  Entity,
  krnlLocalFunctionality,
  ControlPlaneManager,
  AdminGuard,
  WorkspaceBackendFactory,
  FunctionalityTable,
  FilesystemStorageProvider
} from "../packages/core/dist/index.js";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("=================================================");
  console.log("  Testing KrnlTS Universal Backend Architecture  ");
  console.log("=================================================\n");

  const tempDir = path.resolve("./.tmp_backend_test");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const accountsDbPath = path.join(tempDir, "test_accounts.sqlite");
  const workspaceDbPath = path.join(tempDir, "test_workspace.sqlite");
  const storageDirPath = path.join(tempDir, "test_storage");

  try {
    // -------------------------------------------------------------
    // Test 1: Control Plane Account Management & Session Tokens
    // -------------------------------------------------------------
    console.log("1. Control Plane & Admin Guard Testing...");
    const controlPlane = ControlPlaneManager.createLocal(accountsDbPath);

    // Register admin user
    const adminUser = await controlPlane.accountProvider.registerUser({
      email: "admin@krnl.dev",
      username: "admin_krnl",
      password: "secret_password",
      role: "ADMIN"
    });
    console.log("   [+] Admin user registered:", adminUser.id, `(role: ${adminUser.role})`);

    // Authenticate
    const session = await controlPlane.login({
      username: "admin_krnl",
      password: "secret_password"
    });
    console.log("   [+] Login successful, token generated:", session.token.substring(0, 20) + "...");

    // Verify session
    const verifiedSession = await controlPlane.verifyToken(session.token);
    if (!verifiedSession || verifiedSession.role !== "ADMIN") {
      throw new Error("Session verification failed or invalid role");
    }
    console.log("   [+] Session verified successfully");

    // Test AdminGuard pass
    const guardedSession = await AdminGuard.verify(session.token, controlPlane.accountProvider);
    console.log("   [+] AdminGuard approved admin token");

    // Register normal user
    await controlPlane.accountProvider.registerUser({
      email: "user@krnl.dev",
      username: "normal_user",
      password: "user_password",
      role: "USER"
    });
    const userSession = await controlPlane.login({ username: "normal_user", password: "user_password" });
    
    // Test AdminGuard rejection on normal user
    let accessDeniedCaught = false;
    try {
      await AdminGuard.verify(userSession.token, controlPlane.accountProvider);
    } catch (err) {
      if (err.message.includes("[AccessDenied]")) {
        accessDeniedCaught = true;
      }
    }
    if (!accessDeniedCaught) throw new Error("AdminGuard failed to reject non-admin user");
    console.log("   [+] AdminGuard correctly blocked non-admin user");

    // Create workspace in Control Plane
    const ws = await controlPlane.registerWorkspace(adminUser.id, {
      name: "Production App Workspace",
      backendConfig: {
        id: "prod-ws",
        provider: "sqlite",
        mode: "local",
        database: { type: "sqlite", filePath: workspaceDbPath, enableWAL: true },
        storage: { type: "filesystem", basePath: storageDirPath }
      }
    });
    console.log("   [+] Workspace registered:", ws.id, `("${ws.name}")\n`);

    // -------------------------------------------------------------
    // Test 2: Data Provider & FunctionalityTable CRUD Engine
    // -------------------------------------------------------------
    console.log("2. FunctionalityTable CRUD Engine Testing...");
    const backend = WorkspaceBackendFactory.create(ws.backendConfig);
    await backend.initialize();

    const notesTable = new FunctionalityTable("notes", backend.data);

    // Create/Insert
    const inserted1 = await notesTable.create({
      id: "note-1",
      title: "First Note",
      content: "Universal Backend Architecture is live.",
      tags: ["architecture", "backend"],
      views: 10
    });
    console.log("   [+] Record inserted:", inserted1.id, "-", inserted1.title);

    await notesTable.insert([
      { id: "note-2", title: "Second Note", content: "PostgreSQL & SQLite supported.", tags: ["database"], views: 25 },
      { id: "note-3", title: "Third Note", content: "Storage modes 1, 2, and 3 operational.", tags: ["storage"], views: 5 }
    ]);
    console.log("   [+] Batch insert successful");

    // FindOne & Find with filter
    const found1 = await notesTable.findOne("note-1");
    if (!found1 || found1.title !== "First Note") throw new Error("findOne failed");
    console.log("   [+] findOne verified");

    const filtered = await notesTable.find({ views: 25 });
    if (filtered.length !== 1 || filtered[0].id !== "note-2") throw new Error("find with filter failed");
    console.log("   [+] find with filter verified");

    // Update
    const updateRes = await notesTable.update("note-1", { views: 15 });
    if (updateRes.affectedRows !== 1) throw new Error("update failed");
    const updatedNote = await notesTable.findOne("note-1");
    if (updatedNote.views !== 15) throw new Error("update content verification failed");
    console.log("   [+] update verified");

    // Upsert
    await notesTable.upsert({ id: "note-4", title: "Fourth Note", content: "Upserted record", views: 1 });
    const upserted = await notesTable.findOne("note-4");
    if (!upserted || upserted.title !== "Fourth Note") throw new Error("upsert new failed");

    await notesTable.upsert({ id: "note-4", title: "Fourth Note Updated", content: "Upserted record updated", views: 2 });
    const upsertedUpdated = await notesTable.findOne("note-4");
    if (upsertedUpdated.title !== "Fourth Note Updated") throw new Error("upsert existing failed");
    console.log("   [+] upsert (insert and update paths) verified");

    // Count
    const count = await notesTable.count();
    if (count !== 4) throw new Error(`count expected 4, got ${count}`);
    console.log("   [+] count verified:", count);

    // Delete
    const deleteRes = await notesTable.delete("note-4");
    if (deleteRes.affectedRows !== 1) throw new Error("delete failed");
    const countAfterDelete = await notesTable.count();
    if (countAfterDelete !== 3) throw new Error("count after delete mismatch");
    console.log("   [+] delete verified\n");

    // -------------------------------------------------------------
    // Test 3: Storage Provider (KrnlFS Zero-Cloud Local Files)
    // -------------------------------------------------------------
    console.log("3. Storage Provider Testing (Filesystem)...");
    const storage = new FilesystemStorageProvider(storageDirPath);

    const uploadRes = await storage.uploadFile("media/avatar.png", Buffer.from("fake-png-binary-data"));
    console.log("   [+] File uploaded:", uploadRes.url, `(${uploadRes.size} bytes)`);

    const downloadedBuf = await storage.downloadFile("media/avatar.png");
    if (downloadedBuf.toString() !== "fake-png-binary-data") throw new Error("download file content mismatch");
    console.log("   [+] File download content verified");

    const files = await storage.listFiles();
    if (files.length !== 1 || !files[0].path.includes("avatar.png")) throw new Error("listFiles failed");
    console.log("   [+] listFiles verified:", files.length, "files found");

    const deleted = await storage.deleteFile("media/avatar.png");
    if (!deleted) throw new Error("deleteFile failed");
    console.log("   [+] deleteFile verified\n");

    // -------------------------------------------------------------
    // Test 4: Functionality Direct Backend Flag & Credential Cascading
    // -------------------------------------------------------------
    console.log("4. Functionality Backend Flag & Cascading Credential Resolution...");
    
    // Create Root Entity with configured backend
    const systemEntity = new Entity("SystemRoot");
    systemEntity.configureBackend({
      defaultService: "sqlite",
      sqlite: {
        type: "sqlite",
        filePath: path.join(tempDir, "cascaded_entity_db.sqlite"),
        enableWAL: true
      }
    });

    // Create Functionality with backend: "sqlite" flag (inherits credentials from systemEntity)
    const taskLoggerFunctionality = new krnlLocalFunctionality({
      id: "task_logger",
      backend: "sqlite",
      api: async (input, context) => {
        // Direct table access provided by KrnlTS
        if (!context.table) {
          throw new Error("context.table is undefined! Backend injection failed.");
        }
        
        // Use standard table CRUD
        const record = await context.table.create({
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: input.name,
          status: input.status || "PENDING",
          createdAt: Date.now()
        });

        const totalTasks = await context.table.count();
        return {
          success: true,
          task: record,
          totalTasks
        };
      }
    });

    // Bind functionality to entity
    systemEntity.addLocal(taskLoggerFunctionality);

    // Execute functionality
    const execRes1 = await systemEntity.call("task_logger", { name: "Deploy universal backend to Vercel", status: "IN_PROGRESS" });
    console.log("   [+] Execution 1 via context.table:", execRes1.task.name, `- Total tasks in table: ${execRes1.totalTasks}`);

    const execRes2 = await systemEntity.call("task_logger", { name: "Verify SQLite & Supabase compatibility", status: "COMPLETED" });
    console.log("   [+] Execution 2 via context.table:", execRes2.task.name, `- Total tasks in table: ${execRes2.totalTasks}`);

    if (execRes2.totalTasks !== 2) throw new Error(`Expected 2 tasks in table, got ${execRes2.totalTasks}`);
    console.log("   [+] Cascaded credential and automatic table creation verified!\n");

    console.log("=================================================");
    console.log("  ALL UNIVERSAL BACKEND TESTS PASSED (100% OK)   ");
    console.log("=================================================");
  } finally {
    // Cleanup temporary test directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
