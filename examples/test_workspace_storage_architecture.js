// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  LocalSQLiteAccountProvider,
  WorkspaceRuntime,
  StorageAdapterFactory
} from "../packages/core/dist/index.js";
import fs from "fs/promises";
import path from "path";

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * TEST SUITE: testWorkspaceStorageArchitectureSpecification
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Validates User -> AppUserContext -> Workspace storage hierarchy, decoupled
 *          multi-cloud storage adapters (Local, Drive, OneDrive, Supabase, Firebase),
 *          provider-independent WorkspaceFS, SyncEngine replication, primary promotion,
 *          safe detachment, and explicit restore without data loss.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
async function testWorkspaceStorageArchitectureSpecification() {
  console.log("🚀 Starting Workspace Storage Architecture Specification Tests...\n");

  const testDir = path.resolve("./.tmp_storage_spec_test");
  await fs.mkdir(testDir, { recursive: true });

  const accountsDbPath = path.join(testDir, "admin_accounts.json");
  const localStoragePath = path.join(testDir, "local_primary_storage");
  await fs.mkdir(localStoragePath, { recursive: true });

  // ── 1. User, AppUserContext & Multi-App Scope ───────────────────────────────────────────
  console.log("1. Testing User, AppUserContext & Multi-App Scope...");
  const accountProvider = new LocalSQLiteAccountProvider(accountsDbPath);
  const user = await accountProvider.registerUser({
    username: "dinil_musick",
    email: "dinil@example.com",
    password: "secure_password_123",
    role: "USER"
  });

  const appCtx = await accountProvider.getAppUserContext(user.id, "DOCUSTACK_APP");
  if (!appCtx || appCtx.appId !== "DOCUSTACK_APP") {
    throw new Error("Failed to initialize AppUserContext");
  }

  // Update app-scoped workspace ordering
  await accountProvider.updateAppPreferences(user.id, "DOCUSTACK_APP", {
    workspaceOrder: ["ws_music_01", "ws_research_02"]
  });

  const fullUser = await accountProvider.getFullUser(user.id);
  if (!fullUser || !fullUser.apps["DOCUSTACK_APP"]?.preferences.workspaceOrder) {
    throw new Error("Failed to persist AppUserContext workspace preferences");
  }

  console.log(`   ✅ Multi-App Hierarchy: Global user '${user.id}' mapped to 'DOCUSTACK_APP' context.`);
  console.log(`   ✅ App Preferences: Workspace order saved: [${fullUser.apps["DOCUSTACK_APP"].preferences.workspaceOrder.join(", ")}].`);

  // ── 2. Decoupled Storage Adapters & Factory ───────────────────────────────────────────
  console.log("\n2. Testing Decoupled Storage Adapters (Local, Drive, OneDrive, Supabase, Firebase)...");

  const localAdapter = StorageAdapterFactory.create({
    id: "ep_local_01",
    provider: "local",
    configuration: { provider: "local", basePath: localStoragePath },
    enabled: true,
    status: "CONNECTED"
  });

  const icloudAdapter = StorageAdapterFactory.create({
    id: "ep_icloud_01",
    provider: "icloud",
    configuration: { provider: "icloud", basePath: path.join(testDir, "icloud_sandbox") },
    enabled: true,
    status: "CONNECTED"
  });

  const driveAdapter = StorageAdapterFactory.create({
    id: "ep_drive_01",
    provider: "google_drive",
    configuration: { provider: "google_drive", accountId: "dinil_google", rootFolderId: "root_drive" },
    enabled: true,
    status: "CONNECTED"
  });

  const oneDriveAdapter = StorageAdapterFactory.create({
    id: "ep_onedrive_01",
    provider: "onedrive",
    configuration: { provider: "onedrive", accountId: "dinil_ms", rootFolderId: "root_onedrive" },
    enabled: true,
    status: "CONNECTED"
  });

  const supabaseAdapter = StorageAdapterFactory.create({
    id: "ep_supabase_01",
    provider: "supabase_storage",
    configuration: { provider: "supabase_storage", projectUrl: "https://my-app.supabase.co", bucket: "media" },
    enabled: true,
    status: "CONNECTED"
  });

  const firebaseAdapter = StorageAdapterFactory.create({
    id: "ep_firebase_01",
    provider: "firebase_storage",
    configuration: { provider: "firebase_storage", projectId: "my-firebase-app", bucket: "vault" },
    enabled: true,
    status: "CONNECTED"
  });

  await Promise.all([
    localAdapter.initialize(),
    icloudAdapter.initialize(),
    driveAdapter.initialize(),
    oneDriveAdapter.initialize(),
    supabaseAdapter.initialize(),
    firebaseAdapter.initialize()
  ]);

  console.log("   ✅ Storage Adapters: Local, iCloud, Google Drive, OneDrive, Supabase, and Firebase initialized cleanly.");

  // ── 3. WorkspaceRuntime & Provider-Independent WorkspaceFS ────────────────────────────
  console.log("\n3. Testing WorkspaceRuntime & WorkspaceFS Operations...");

  const workspaceSpec = {
    id: "ws_music_01",
    name: "Music Production Vault",
    primaryStorage: {
      id: "ep_local_01",
      provider: "local",
      configuration: { provider: "local", basePath: localStoragePath },
      enabled: true,
      status: "CONNECTED",
      syncState: "SYNCED"
    },
    backupStorages: [
      {
        id: "ep_icloud_01",
        provider: "icloud",
        configuration: { provider: "icloud", basePath: path.join(testDir, "icloud_sandbox") },
        enabled: true,
        status: "CONNECTED",
        syncState: "SYNCED"
      },
      {
        id: "ep_drive_01",
        provider: "google_drive",
        configuration: { provider: "google_drive", accountId: "dinil_google", rootFolderId: "root_drive" },
        enabled: true,
        status: "CONNECTED",
        syncState: "SYNCED"
      },
      {
        id: "ep_onedrive_01",
        provider: "onedrive",
        configuration: { provider: "onedrive", accountId: "dinil_ms", rootFolderId: "root_onedrive" },
        enabled: true,
        status: "CONNECTED",
        syncState: "SYNCED"
      },
      {
        id: "ep_supabase_01",
        provider: "supabase_storage",
        configuration: { provider: "supabase_storage", projectUrl: "https://my-app.supabase.co", bucket: "media" },
        enabled: true,
        status: "CONNECTED",
        syncState: "SYNCED"
      }
    ],
    sync: {
      enabled: true,
      mode: "on_write",
      conflictStrategy: "primary_wins",
      deletePropagation: true,
      retry: { maxAttempts: 3, backoffMs: 500 },
      verification: { verifyChecksums: true }
    },
    preferences: {},
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const runtime = await WorkspaceRuntime.create(workspaceSpec);

  // Write file via WorkspaceFS
  const audioSampleContent = "RIFF_SAMPLE_BINARY_METADATA_SYNTH_WAV";
  await runtime.filesystem.write("audio/synth_lead.wav", audioSampleContent);

  const readBack = await runtime.filesystem.readText("audio/synth_lead.wav");
  if (readBack !== audioSampleContent) {
    throw new Error("WorkspaceFS read/write verification failed");
  }

  const statMeta = await runtime.filesystem.stat("audio/synth_lead.wav");
  if (!statMeta.contentHash || statMeta.type !== "file") {
    throw new Error("WorkspaceFS stat metadata missing SHA-256 contentHash");
  }

  console.log(`   ✅ WorkspaceFS: Written & read 'audio/synth_lead.wav' (SHA-256: ${statMeta.contentHash.slice(0, 16)}...).`);

  // ── 4. High-Reliability SyncEngine Replication & Checksums ────────────────────────────
  console.log("\n4. Testing SyncEngine Multi-Cloud Replication & Checksum Verification...");

  const syncResult = await runtime.syncEngine.sync(workspaceSpec);
  if (!syncResult.ok) {
    throw new Error(`SyncEngine replication failed: ${JSON.stringify(syncResult.failedEndpoints)}`);
  }

  const icloudExists = await icloudAdapter.exists("audio/synth_lead.wav");
  const driveExists = await driveAdapter.exists("audio/synth_lead.wav");
  const onedriveExists = await oneDriveAdapter.exists("audio/synth_lead.wav");
  const supabaseExists = await supabaseAdapter.exists("audio/synth_lead.wav");

  if (!icloudExists || !driveExists || !onedriveExists || !supabaseExists) {
    throw new Error("Backup replication failed to propagate across cloud adapters");
  }

  const verification = await runtime.syncEngine.verify(workspaceSpec);
  if (!verification.ok || verification.matchedFiles !== 1) {
    throw new Error("Checksum verification between Primary and Backups failed");
  }

  console.log(`   ✅ SyncEngine: Replicated across 4 backup providers (including iCloud) with 100% SHA-256 matching.`);

  // ── 5. Dynamic Primary Switch (Promotion) ─────────────────────────────────────────────
  console.log("\n5. Testing Dynamic Primary Promotion (Google Drive -> Primary)...");

  await runtime.changePrimary("ep_drive_01");

  if (runtime.primary.provider !== "google_drive") {
    throw new Error("Primary promotion failed to switch active provider");
  }

  const newPrimaryRead = await runtime.filesystem.readText("audio/synth_lead.wav");
  if (newPrimaryRead !== audioSampleContent) {
    throw new Error("Failed to read from newly promoted Primary Storage");
  }

  console.log("   ✅ Primary Promotion: Google Drive promoted to Primary, Local Storage demoted to Backup with zero data loss.");

  // ── 6. Safe Detachment (DETACH != DELETE) ──────────────────────────────────────────────
  console.log("\n6. Testing Safe Detach Semantics (DETACH != DELETE)...");

  await runtime.detachStorage("ep_supabase_01");
  const isSupabaseDetached = !runtime.workspace.backupStorages.some(b => b.id === "ep_supabase_01");
  const supabaseStillHasData = await supabaseAdapter.exists("audio/synth_lead.wav");

  if (!isSupabaseDetached || !supabaseStillHasData) {
    throw new Error("Detach operation corrupted remote storage data");
  }

  console.log("   ✅ Safe Detachment: Endpoint detached from workspace configuration; remote data remains intact.");

  // ── 7. Explicit Backup Restore ────────────────────────────────────────────────────────
  console.log("\n7. Testing Explicit Restore Routine...");

  // Write new file to backup and restore
  await oneDriveAdapter.write("notes/mixing_notes.txt", "EQ at 4kHz + Compressor 2:1");
  const restoreResult = await runtime.syncEngine.restore(workspaceSpec.backupStorages.find(b => b.id === "ep_onedrive_01"));

  if (!restoreResult.ok || restoreResult.filesRestoredCount < 1) {
    throw new Error("Explicit backup restore failed");
  }

  const restoredNote = await runtime.filesystem.readText("notes/mixing_notes.txt");
  if (!restoredNote.includes("EQ at 4kHz")) {
    throw new Error("Restored file content mismatch");
  }

  console.log(`   ✅ Explicit Restore: Restored ${restoreResult.filesRestoredCount} file(s) from OneDrive into Primary.`);

  // Cleanup test runtime
  await runtime.dispose();
  await fs.rm(testDir, { recursive: true, force: true });

  console.log("\n🎉 ALL WORKSPACE STORAGE ARCHITECTURE TESTS PASSED (100% SUCCESS)!\n");
}

testWorkspaceStorageArchitectureSpecification().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
