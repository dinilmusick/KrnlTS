import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLuthAuth } from './LuthAuthPage.js';
import { LuthProtectedRoute } from './LuthProtectedRoute.js';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  client: {
    getSession: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('./LuthAuthClient.js', () => ({
  createLuthAuthClient: () => mocks.client,
}));

describe('useLuthAuth lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.client.getSession.mockResolvedValue({ authenticated: false });
    mocks.client.signInWithEmail.mockResolvedValue({});
    mocks.client.signUpWithEmail.mockResolvedValue({});
    mocks.client.signInWithGoogle.mockResolvedValue({ url: 'https://accounts.google.com/authorize' });
    mocks.client.signOut.mockResolvedValue(undefined);
  });

  it('hydrates, signs in, and signs out through the canonical client', async () => {
    const user = { id: 'luth-user-1', email: 'user@example.test', name: 'Test User' };
    mocks.client.getSession
      .mockResolvedValueOnce({ authenticated: false })
      .mockResolvedValueOnce({ authenticated: true, user, session: { id: 'session-1', userId: user.id, expiresAt: '2099-01-01T00:00:00.000Z' } });

    const { result } = renderHook(() => useLuthAuth({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test-app',
    }));

    await waitFor(() => expect(result.current.initializing).toBe(false));
    expect(result.current.session.authenticated).toBe(false);

    await act(async () => {
      await result.current.signIn({ email: user.email, password: 'not-a-real-password' });
    });
    expect(mocks.client.signInWithEmail).toHaveBeenCalledWith({ email: user.email, password: 'not-a-real-password' });
    expect(result.current.user).toEqual(user);

    await act(async () => {
      await result.current.signOut();
    });
    expect(mocks.client.signOut).toHaveBeenCalledTimes(1);
    expect(result.current.session.authenticated).toBe(false);
  });

  it('registers new accounts through the canonical Luth client and hydrates the returned session', async () => {
    const user = { id: 'luth-user-2', email: 'new@example.test', name: 'New User' };
    mocks.client.getSession
      .mockResolvedValueOnce({ authenticated: false })
      .mockResolvedValueOnce({ authenticated: true, user, session: { id: 'session-2', userId: user.id } });
    const { result } = renderHook(() => useLuthAuth({ ecosystemId: 'ultrst-armada', applicationId: 'test-app' }));
    await waitFor(() => expect(result.current.initializing).toBe(false));
    await act(async () => {
      await result.current.signUp({ name: user.name, email: user.email, password: 'not-a-real-password' });
    });
    expect(mocks.client.signUpWithEmail).toHaveBeenCalledWith({
      name: user.name, email: user.email, password: 'not-a-real-password',
    });
    expect(result.current.user).toEqual(user);
    expect(result.current.session.authenticated).toBe(true);
  });

  it('surfaces session hydration failures without inventing an authenticated state', async () => {
    mocks.client.getSession.mockRejectedValueOnce(new Error('Luth unavailable'));
    const { result } = renderHook(() => useLuthAuth({ ecosystemId: 'ultrst-armada', applicationId: 'test-app' }));
    await waitFor(() => expect(result.current.initializing).toBe(false));
    expect(result.current.session.authenticated).toBe(false);
    expect(result.current.error).toBe('Luth unavailable');
  });

  it('revalidates on focus and drops expired sessions before protected content can continue', async () => {
    const user = { id: 'luth-user-expiring', email: 'expired@example.test', name: 'Expired User' };
    mocks.client.getSession
      .mockResolvedValueOnce({ authenticated: true, user, session: { id: 'session-expiring', userId: user.id } })
      .mockResolvedValueOnce({ authenticated: false, error: 'SESSION_INVALID' });
    const { result } = renderHook(() => useLuthAuth({ ecosystemId: 'ultrst-armada', applicationId: 'test-app' }));
    await waitFor(() => expect(result.current.session.authenticated).toBe(true));
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    await waitFor(() => expect(result.current.session.authenticated).toBe(false));
    expect(mocks.client.getSession).toHaveBeenCalledTimes(2);
  });

  it('renders protected application content only after canonical session hydration', async () => {
    const user = { id: 'luth-protected-user', email: 'protected@example.test', name: 'Protected User' };
    mocks.client.getSession.mockResolvedValueOnce({ authenticated: true, user, session: { id: 'protected-session', userId: user.id } });
    render(
      <LuthProtectedRoute ecosystemId="ultrst-armada" applicationId="protected-app" appName="Protected App">
        {({ user: currentUser }) => <main>Welcome {currentUser?.email}</main>}
      </LuthProtectedRoute>,
    );
    expect(await screen.findByText('Welcome protected@example.test')).toBeTruthy();
  });

  it('delegates Google sign-in to Luth', async () => {
    const { result } = renderHook(() => useLuthAuth({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test-app',
    }));
    await waitFor(() => expect(result.current.initializing).toBe(false));

    let response: unknown;
    await act(async () => {
      response = await result.current.signInWithGoogle('https://app.example.test/callback');
    });
    expect(mocks.client.signInWithGoogle).toHaveBeenCalledWith({
      callbackURL: 'https://app.example.test/callback',
    });
    expect(response).toEqual({ url: 'https://accounts.google.com/authorize' });
  });
});
