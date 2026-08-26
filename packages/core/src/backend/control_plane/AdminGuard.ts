/**
 * @file AdminGuard.ts
 * @description Strict backend API boundary authorization guard enforcing role checks.
 */

import { AuthSession, IAccountProvider } from "../types.js";

export class AdminGuard {
  static async verify(authHeaderOrToken: string | null | undefined, accountProvider: IAccountProvider): Promise<AuthSession> {
    const token = authHeaderOrToken?.startsWith("Bearer ")
      ? authHeaderOrToken.substring(7).trim()
      : authHeaderOrToken?.trim() || null;

    const session = await accountProvider.verifySession(token);

    if (!session) {
      throw new Error("[AccessDenied] Authentication required: Invalid or missing session token.");
    }

    if (session.role !== "ADMIN") {
      throw new Error(`[AccessDenied] Forbidden: Administrative role required. Current role: "${session.role}".`);
    }

    return session;
  }

  static enforce(session: AuthSession | null | undefined): void {
    if (!session) {
      throw new Error("[AccessDenied] Authentication required: Session is null.");
    }
    if (session.role !== "ADMIN") {
      throw new Error(`[AccessDenied] Forbidden: Administrative privileges required. Current role: "${session.role}".`);
    }
  }
}
