'use client';

import React from 'react';
import { AuthPage, type AuthResult } from '@ultrst-armada/floks/ui';
import { UserAccount } from '@/libraries/types/auth';
import { luthAuthClient } from '../../auth/luthAuthClient';

interface WelcomePageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

function toUserAccount(user: NonNullable<Awaited<ReturnType<typeof luthAuthClient.getSession>>['user']>): UserAccount {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.email.split('@')[0],
    role: 'user',
    avatarGlyph: '👤',
    createdAt: new Date().toISOString(),
  };
}

export function WelcomePage({ onLoginSuccess }: WelcomePageProps): React.ReactElement {
  const authenticate = async (operation: () => Promise<unknown>): Promise<AuthResult> => {
    try {
      await operation();
      const session = await luthAuthClient.getSession();
      if (!session.authenticated || !session.user) {
        return { success: false, error: 'Luth did not establish an authenticated session.' };
      }
      onLoginSuccess(toUserAccount(session.user));
      return { success: true, user: session.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed.' };
    }
  };

  return (
    <AuthPage
      appName="SRKL SERVICE HUB"
      appSubtitle="ACTIVE SURVEILLANCE & AGENT EXECUTION WORKSPACE"
      footerText="Canonical Luth identity gateway"
      onLogin={(email, password) => authenticate(() => luthAuthClient.signInWithEmail({ email, password }))}
      onRegister={({ name, email, password }) =>
        authenticate(() => luthAuthClient.signUpWithEmail({ name, email, password }))
      }
      onGoogleSignIn={async () => {
        try {
          const result = await luthAuthClient.signInWithGoogle();
          const url = (result as { url?: string }).url;
          if (!url) return { success: false, error: 'Luth did not return a Google authorization URL.' };
          window.location.assign(url);
          return { success: true };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Google sign-in failed.' };
        }
      }}
    />
  );
}

export default WelcomePage;
