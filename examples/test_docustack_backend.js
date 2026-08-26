// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & TEST SETUP
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  AuditLogger,
  DatabaseClusterManager,
  AdminGuard,
  WorkspaceBackendFactory,
  LocalSQLiteAccountProvider,
  TursoLibSQLDataProvider,
  MongoAtlasDataProvider,
  VercelBlobStorageProvider
} from "../packages/core/dist/index.js";
import fs from "fs";

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * TEST SUITE: testDocuStackUniversalBackendRefinements
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Verifies Audit Logging, Database Clustering, Failover Promotion, RBAC Guards,
 *          and Pluggable Edge Engine Providers (Turso LibSQL, Mongo Atlas, Vercel Blob).
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
async function testDocuStackUniversalBackendRefinements() {
  console.log("🚀 Starting DocuStack Universal Backend Integration Tests...\n");

  const testAuditPath = "./.krnl_test_audit.jsonl";
  const testClusterPath = "./.krnl_test_cluster.json";
  const testAccountsPath = "./.krnl_test_accounts.sqlite";

  try {
    // ── 1. Audit Logger Test ─────────────────────────────────────────────────────────────
    console.log("1. Testing Immutable Audit Logger...");
    const auditLogger = new AuditLogger(testAuditPath);
    await auditLogger.log({
      actorUserId: "admin_01",
      actorRole: "ADMIN",
      action: "INIT_CLUSTER",
      resource: "cluster_vault",
      status: "SUCCESS"
    });
    await auditLogger.log({
      actorUserId: "user_02",
      actorRole: "USER",
      action: "LOGIN",
      resource: "session_token",
      status: "SUCCESS"
    });

    const auditLogs = await auditLogger.query({ actorRole: "ADMIN" });
    if (auditLogs.length !== 1 || auditLogs[0].action !== "INIT_CLUSTER") {
      throw new Error(`Audit log assertion failed: expected 1 admin log, found ${auditLogs.length}`);
    }
    console.log("   ✅ AuditLogger: recorded and queried immutable log entries successfully.");

    // ── 2. Database Cluster Manager & Failover Test ───────────────────────────────────────
    console.log("\n2. Testing Database Cluster Redundancy & Failover Manager...");
    const clusterManager = new DatabaseClusterManager(testClusterPath, auditLogger);

    // Upsert a Turso edge clone
    await clusterManager.upsertClusterEntry({
      id: "turso_edge_replica",
      name: "Turso Edge LibSQL Clone",
      role: "redundant_clone",
      enabled: true,
      config: {
        type: "turso",
        endpoint: "https://mock-db.turso.io",
        authToken: "mock_token"
      },
      healthStatus: "HEALTHY"
    });

    const vaultBefore = clusterManager.getVault();
    if (vaultBefore.primaryDatabaseId !== "default_primary_sqlite") {
      throw new Error(`Initial primary mismatch: ${vaultBefore.primaryDatabaseId}`);
    }

    // Trigger Snapshot Sync
    const syncRes = await clusterManager.syncRedundantDatabases();
    console.log(`   ✅ Snapshot Sync: replicated across ${syncRes.syncedCount} backup clone(s).`);

    // Execute Dynamic Promotion & Failover
    const vaultAfter = await clusterManager.promoteToPrimary("turso_edge_replica", "admin_01");
    if (vaultAfter.primaryDatabaseId !== "turso_edge_replica") {
      throw new Error(`Promotion failed: expected turso_edge_replica, got ${vaultAfter.primaryDatabaseId}`);
    }

    const oldPrimary = vaultAfter.clusters.find(c => c.id === "default_primary_sqlite");
    if (oldPrimary?.role !== "redundant_clone") {
      throw new Error(`Old primary demotion failed: role is ${oldPrimary?.role}`);
    }
    console.log("   ✅ Failover Promotion: dynamic promotion and auto-demotion succeeded.");

    // ── 3. RBAC AdminGuard & Moderator Tests ──────────────────────────────────────────────
    console.log("\n3. Testing Extended RBAC & AdminGuard Verification...");
    const accountProvider = new LocalSQLiteAccountProvider(testAccountsPath);
    const adminSession = await accountProvider.authenticate({
      username: "super_admin",
      password: "password123",
      role: "ADMIN"
    });
    const modUser = await accountProvider.registerUser({
      username: "moderator_dan",
      password: "password123",
      role: "MODERATOR"
    });
    const modSession = await accountProvider.authenticate({
      username: "moderator_dan",
      password: "password123"
    });

    // Verify Admin
    const verifiedAdmin = await AdminGuard.verify(adminSession.token, accountProvider);
    if (verifiedAdmin.userId !== "super_admin") {
      throw new Error("AdminGuard verify failed for super_admin");
    }

    // Verify Moderator via verifyModeratorOrAdmin
    const verifiedMod = await AdminGuard.verifyModeratorOrAdmin(modSession.token, accountProvider);
    if (verifiedMod.userId !== "moderator_dan") {
      throw new Error("AdminGuard verifyModeratorOrAdmin failed for moderator_dan");
    }
    console.log("   ✅ RBAC & AdminGuard: verified ADMIN and MODERATOR access boundaries.");

    // ── 4. Pluggable Edge Engine Instantiations ──────────────────────────────────────────
    console.log("\n4. Testing Pluggable Edge Engine Providers...");
    const tursoProvider = new TursoLibSQLDataProvider({
      type: "turso",
      endpoint: "https://test.turso.io",
      authToken: "test_token"
    });
    if (tursoProvider.engine !== "turso") {
      throw new Error("Turso engine mismatch");
    }

    const mongoProvider = new MongoAtlasDataProvider({
      type: "mongodb",
      endpoint: "https://data.mongodb-api.com/test",
      apiKey: "test_key"
    });
    if (mongoProvider.engine !== "mongodb") {
      throw new Error("MongoDB engine mismatch");
    }

    const vercelBlob = new VercelBlobStorageProvider({
      type: "vercel_blob",
      token: "vercel_blob_rw_test"
    });
    if (vercelBlob.driver !== "vercel_blob") {
      throw new Error("Vercel Blob driver mismatch");
    }
    console.log("   ✅ Edge Providers: Turso LibSQL, MongoDB Atlas, and Vercel Blob instantiated cleanly.");

    // ── 5. Credential Cascade Fallback Resolution ─────────────────────────────────────────
    console.log("\n5. Testing Credential Cascade Fallback Resolution...");
    const cascadedConfig = WorkspaceBackendFactory.resolveCredentialsCascade(
      { service: "turso" },
      { defaultService: "sqlite", sqlite: { type: "sqlite", filePath: "./fallback.sqlite" } },
      { type: "sqlite", filePath: "./fallback.sqlite", enableWAL: true }
    );
    if (cascadedConfig.type !== "sqlite" || cascadedConfig.filePath !== "./fallback.sqlite") {
      throw new Error(`Cascade fallback mismatch: ${JSON.stringify(cascadedConfig)}`);
    }
    console.log("   ✅ Credential Cascade: successfully fell back to safe local SQLite.");

    console.log("\n🎉 ALL DOCUSTACK UNIVERSAL BACKEND TESTS PASSED (100% SUCCESS)!\n");
  } finally {
    // Cleanup test artifacts
    if (fs.existsSync(testAuditPath)) fs.unlinkSync(testAuditPath);
    if (fs.existsSync(testClusterPath)) fs.unlinkSync(testClusterPath);
    if (fs.existsSync(testAccountsPath)) fs.unlinkSync(testAccountsPath);
  }
}

testDocuStackUniversalBackendRefinements().catch(err => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
