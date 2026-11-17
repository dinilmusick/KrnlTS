import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('canonical auth UI contract', () => {
  it('exposes the canonical authentication hydration screen', () => {
    const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.ts'), 'utf8');
    expect(source).toContain("AuthLoadingScreen");
  });
  it('exposes Google sign-in and live email validation', () => {
    const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'AuthPage.tsx'), 'utf8');
    expect(source).toContain('onGoogleSignIn');
    expect(source).toContain('emailValid');
    expect(source).toContain('Enter a valid email address.');
    expect(source).toContain('GoogleSignInButton');
  });

  it('surfaces Google sign-in failures instead of leaving rejected promises unhandled', () => {
    const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'AuthPage.tsx'), 'utf8');
    expect(source).toContain("setGoogleLoading(true)");
    expect(source).toContain("catch (error)");
    expect(source).toContain("setError(error instanceof Error ? error.message : 'Google sign-in failed.')");
    expect(source).toContain("finally");
    expect(source).toContain("setGoogleLoading(false)");
  });

  it('routes the integrated auth page through the canonical Kloks client and session lifecycle', () => {
    const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'LuthAuthPage.tsx'), 'utf8');
    expect(source).toContain("createLuthAuthClient as createClient");
    expect(source).toContain('client.getSession()');
    expect(source).toContain('client.signInWithEmail(credentials)');
    expect(source).toContain('client.signUpWithEmail(input)');
    expect(source).toContain('client.signInWithGoogle');
    expect(source).toContain('client.signOut()');
    expect(source).toContain("window.addEventListener('focus', revalidate)");
  });

  it('provides a protected route that verifies Luth before rendering children', () => {
    const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'LuthProtectedRoute.tsx'), 'utf8');
    expect(source).toContain('<LuthAuthPage');
    expect(source).toContain('authenticatedContent={children}');
    expect(source).toContain('unauthenticatedContent={fallback}');
    expect(source).toContain('loadingContent={loadingFallback}');
    expect(source).toContain('...presentation');
  });

  it('keeps LoginModal on the canonical client without local token storage or direct auth endpoints', () => {
    const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'LoginModal.tsx'), 'utf8');
    expect(source).toContain('useLuthAuth');
    expect(source).toContain('auth.signIn');
    expect(source).toContain('auth.signUp');
    expect(source).toContain('auth.signInWithGoogle');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain("fetch('/api/auth");
    expect(source).not.toContain('skipo_auth_token');
  });

  it('keeps Google Drive authorization out of the sign-in control', () => {
    const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'GoogleSignInButton.tsx'), 'utf8');
    expect(source).not.toContain('drive');
    expect(source).not.toContain('scope');
  });
});
