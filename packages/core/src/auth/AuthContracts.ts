export type CanonicalAuthProvider = 'email' | 'google';

export interface CanonicalAuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
}

export interface CanonicalAuthSession {
  id: string;
  userId: string;
  expiresAt: string;
}

export interface CanonicalAuthSessionResult {
  authenticated: boolean;
  user?: CanonicalAuthUser;
  session?: CanonicalAuthSession;
  error?: string;
}

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
