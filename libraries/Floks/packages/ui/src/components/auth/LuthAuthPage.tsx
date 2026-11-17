import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthPage, type AuthPageProps, type AuthResult } from './AuthPage.js';
import { AuthLoadingScreen } from './AuthLoadingScreen.js';
import { createLuthAuthClient as createClient } from './LuthAuthClient.js';
import type { LuthAuthClient, LuthSessionResult } from './LuthAuthClient.js';

export interface LuthAuthConfig {
  ecosystemId: string;
  applicationId: string;
  luthUrl?: string;
  origin?: string;
}

export interface UseLuthAuthResult {
  client: LuthAuthClient;
  session: LuthSessionResult;
  user: LuthSessionResult['user'];
  loading: boolean;
  initializing: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => Promise<LuthSessionResult>;
  signIn: (credentials: { email: string; password: string }) => Promise<LuthSessionResult>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<LuthSessionResult>;
  signInWithGoogle: (callbackURL?: string) => Promise<unknown>;
  signOut: () => Promise<void>;
}

export interface LuthAuthPageProps extends Omit<AuthPageProps, 'onLogin' | 'onRegister' | 'onGoogleSignIn' | 'onSuccess'>, LuthAuthConfig {
  onAuthenticated?: (user: NonNullable<LuthSessionResult['user']>) => void;
  onSuccess?: (result: AuthResult) => void;
  authenticatedContent?: React.ReactNode | ((auth: UseLuthAuthResult) => React.ReactNode);
  unauthenticatedContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  /** When provided, renders a "CONTINUE AS GUEST" button on the auth page. */
  onContinueAsGuest?: () => void;
}

export function createLuthAuthClientForApplication(input: LuthAuthConfig): LuthAuthClient {
  return createClient({
    ecosystemId: input.ecosystemId,
    applicationId: input.applicationId,
    ...(input.luthUrl ? { luthUrl: input.luthUrl } : {}),
    ...(input.origin ? { origin: input.origin } : {}),
  });
}

export function useLuthAuth(config: LuthAuthConfig): UseLuthAuthResult {
  const client = useMemo(
    () => createLuthAuthClientForApplication(config),
    [config.ecosystemId, config.applicationId, config.luthUrl, config.origin],
  );
  const [session, setSession] = useState<LuthSessionResult>({ authenticated: false });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    setError(null);
    try {
      const next = await client.getSession();
      setSession(next);
      return next;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to retrieve the Luth session.';
      setError(message);
      throw cause;
    } finally {
      if (!options.silent) setLoading(false);
      setInitializing(false);
    }
  }, [client]);

  useEffect(() => {
    void refresh().catch(() => undefined);
    if (typeof window === 'undefined') return;
    const revalidate = () => { void refresh({ silent: true }).catch(() => undefined); };
    window.addEventListener('focus', revalidate);
    window.addEventListener('online', revalidate);
    return () => {
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('online', revalidate);
    };
  }, [refresh]);

  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    await client.signInWithEmail(credentials);
    return refresh();
  }, [client, refresh]);

  const signUp = useCallback(async (input: { name: string; email: string; password: string }) => {
    await client.signUpWithEmail(input);
    return refresh();
  }, [client, refresh]);

  const signInWithGoogle = useCallback(
    (callbackURL?: string) => client.signInWithGoogle(callbackURL ? { callbackURL } : undefined),
    [client],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await client.signOut();
      setSession({ authenticated: false });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Luth sign-out failed.';
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { client, session, user: session.user, loading, initializing, error, refresh, signIn, signUp, signInWithGoogle, signOut };
}

export const LuthAuthPage: React.FC<LuthAuthPageProps> = ({
  ecosystemId,
  applicationId,
  luthUrl,
  origin,
  onAuthenticated,
  onSuccess,
  authenticatedContent,
  unauthenticatedContent,
  loadingContent,
  ...presentation
}) => {
  const auth = useLuthAuth({ ecosystemId, applicationId, luthUrl, origin });
  const onAuthenticatedRef = useRef(onAuthenticated);
  const notifiedUserId = useRef<string | null>(null);
  useEffect(() => { onAuthenticatedRef.current = onAuthenticated; }, [onAuthenticated]);

  useEffect(() => {
    if (!auth.session.authenticated) {
      notifiedUserId.current = null;
      return;
    }
    if (auth.user && notifiedUserId.current !== auth.user.id) {
      notifiedUserId.current = auth.user.id;
      onAuthenticatedRef.current?.(auth.user);
    }
  }, [auth.session.authenticated, auth.user]);

  const toResult = (session: LuthSessionResult): AuthResult => {
    if (!session.authenticated || !session.user) return { success: false, error: 'Luth did not establish an authenticated session.' };
    return { success: true, user: session.user };
  };

  if (auth.initializing) return <>{loadingContent ?? <AuthLoadingScreen label="CONNECTING TO LUTH..." />}</>;

  if (auth.session.authenticated && auth.user) {
    if (typeof authenticatedContent === 'function') return <>{authenticatedContent(auth)}</>;
    return authenticatedContent ?? (
      <div data-frnl-component="LuthAuthenticatedView" className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--skipo-bg)] text-[var(--skipo-text)] font-mono">
        <span className="text-xs">SIGNED IN AS {auth.user.email}</span>
        {auth.error && <p role="alert">{auth.error}</p>}
        <button type="button" onClick={() => { void auth.signOut(); }} className="border px-4 py-2 text-xs">SIGN OUT</button>
      </div>
    );
  }

  if (unauthenticatedContent) return <>{unauthenticatedContent}</>;

  return (
    <AuthPage
      {...presentation}
      onLogin={async (email, password) => {
        const value = toResult(await auth.signIn({ email, password }));
        if (value.success) onSuccess?.(value);
        return value;
      }}
      onRegister={async ({ name, email, password }) => {
        const value = toResult(await auth.signUp({ name, email, password }));
        if (value.success) onSuccess?.(value);
        return value;
      }}
      authError={auth.error}
      onGoogleSignIn={async () => {
        try {
          const value = await auth.signInWithGoogle();
          const payload = value && typeof value === 'object' ? value as Record<string, unknown> : {};
          const redirectUrl = typeof payload.url === 'string' ? payload.url : undefined;
          if (redirectUrl && typeof window !== 'undefined') {
            window.location.assign(redirectUrl);
            return { success: true, redirectUrl };
          }
          const session = await auth.refresh();
          return toResult(session);
        } catch (cause) {
          return { success: false, error: cause instanceof Error ? cause.message : 'Google sign-in failed.' };
        }
      }}
    />
  );
};

export default LuthAuthPage;
