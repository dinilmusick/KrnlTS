export {
  LuthAuthClient,
  createLuthAuthClient,
  resolveClientOrigin,
  resolveClientEnvironment,
} from '@dinilmusick/gutts/auth';

export type {
  DeploymentEnvironment,
  EmailSignInCredentials,
  EmailSignUpData,
  GoogleSignInOptions,
  LuthAuthClientConfig,
  LuthAuthTokenStore,
  LuthSessionResult,
  RegisterApplicationResult,
  LuthUser,
  LuthSession,
} from '@dinilmusick/gutts/auth';

export { LuthAuthError } from '@dinilmusick/gutts/auth';

export { LuthAuthClient as CanonicalAuthClient } from '@dinilmusick/gutts/auth';
export { createLuthAuthClient as createCanonicalAuthClient } from '@dinilmusick/gutts/auth';
export type { LuthUser as CanonicalAuthUser, LuthSession as CanonicalAuthSession } from '@dinilmusick/gutts/auth';
