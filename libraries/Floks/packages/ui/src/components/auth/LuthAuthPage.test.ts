import { describe, expect, it } from 'vitest';
import { DEFAULT_LUTH_URL } from '@dinilmusick/gutts/auth';
import { createLuthAuthClientForApplication } from './LuthAuthPage.js';

describe('LuthAuthPage canonical client contract', () => {
  it('binds app identity to the shared Luth client and canonical service URL', () => {
    const client = createLuthAuthClientForApplication({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test-app',
    });

    expect(client.ecosystemId).toBe('ultrst-armada');
    expect(client.applicationId).toBe('test-app');
    expect(client.luthUrl).toBe(DEFAULT_LUTH_URL);
    expect(typeof client.getSession).toBe('function');
    expect(typeof client.signInWithEmail).toBe('function');
    expect(typeof client.signUpWithEmail).toBe('function');
    expect(typeof client.signInWithGoogle).toBe('function');
    expect(typeof client.signOut).toBe('function');
  });
});
