import type {
  LuthSession,
  LuthSessionResult,
  LuthUser,
} from '@dinilmusick/gutts/auth';

export type CanonicalAuthProvider = 'email' | 'google';

export type CanonicalAuthUser = LuthUser;
export type CanonicalAuthSession = LuthSession;
export type CanonicalAuthSessionResult = LuthSessionResult;

export interface CanonicalAuthRegistration {
  ecosystemId: string;
  applicationId: string;
  origin: string;
  environment: 'production' | 'staging' | 'preview' | 'development';
}

export interface CanonicalAuthServiceContract {
  serviceId: string;
  operations: readonly [
    'status',
    'getSession',
    'signInWithEmail',
    'signUpWithEmail',
    'signInWithGoogle',
    'signOut'
  ];
  providers: readonly CanonicalAuthProvider[];
}
