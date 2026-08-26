// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { AuthSession, IAccountProvider, UserRole } from "../types.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. ADMIN & RBAC AUTHORIZATION GUARD
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: AdminGuard
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Strict API boundary authorization guard enforcing role-based access control
 *          (RBAC: ADMIN / MODERATOR / USER) on administrative and sensitive operations.
 *
 * Flow Chart:
 *   [Protected Action] ───► [Extract Bearer Token] ───► [Verify Session]
 *                                                               │
 *                                                               ▼
 *                                                    [Check Allowed Roles]
 *                                                    ├── (Match) ──► [Grant Access]
 *                                                    └── (Fail)  ──► [Throw AccessDenied]
 *
 * Example Usage:
 *   const session = await AdminGuard.verify(authHeader, accountProvider);
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class AdminGuard {
  /**
   * Verifies that the session token is valid and belongs to an ADMIN.
   */
  public static async verify(
    authHeaderOrToken: string | null | undefined,
    accountProvider: IAccountProvider
  ): Promise<AuthSession> {
    return AdminGuard.verifyRole(authHeaderOrToken, accountProvider, ["ADMIN", "admin"]);
  }

  /**
   * Verifies that the session token is valid and belongs to either a MODERATOR or ADMIN.
   */
  public static async verifyModeratorOrAdmin(
    authHeaderOrToken: string | null | undefined,
    accountProvider: IAccountProvider
  ): Promise<AuthSession> {
    return AdminGuard.verifyRole(authHeaderOrToken, accountProvider, ["ADMIN", "MODERATOR", "admin", "moderator"]);
  }

  /**
   * Generalized RBAC verification against a list of allowed roles.
   */
  public static async verifyRole(
    authHeaderOrToken: string | null | undefined,
    accountProvider: IAccountProvider,
    allowedRoles: UserRole[] = ["ADMIN"]
  ): Promise<AuthSession> {
    const token = authHeaderOrToken?.startsWith("Bearer ")
      ? authHeaderOrToken.substring(7).trim()
      : authHeaderOrToken?.trim() || null;

    const session = await accountProvider.verifySession(token);

    if (!session) {
      throw new Error("[AccessDenied] Authentication required: Invalid or missing session token.");
    }

    const currentRoleNormalized = String(session.role).toUpperCase();
    const isAllowed = allowedRoles.some(r => String(r).toUpperCase() === currentRoleNormalized);

    if (!isAllowed) {
      throw new Error(
        `[AccessDenied] Forbidden: Elevated privileges required (${allowedRoles.join(", ")}). Current role: "${session.role}".`
      );
    }

    return session;
  }

  /**
   * Synchronous assertion on pre-resolved session.
   */
  public static enforce(
    session: AuthSession | null | undefined,
    allowedRoles: UserRole[] = ["ADMIN"]
  ): void {
    if (!session) {
      throw new Error("[AccessDenied] Authentication required: Session is null.");
    }
    const currentRoleNormalized = String(session.role).toUpperCase();
    const isAllowed = allowedRoles.some(r => String(r).toUpperCase() === currentRoleNormalized);
    if (!isAllowed) {
      throw new Error(
        `[AccessDenied] Forbidden: Insufficient role permissions. Current role: "${session.role}".`
      );
    }
  }
}
