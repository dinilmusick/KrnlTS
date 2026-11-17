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
} from '@dinilmusick/gutts/auth';

export { LuthAuthError } from '@dinilmusick/gutts/auth';

export { LuthAuthClient as CanonicalAuthClient } from '@dinilmusick/gutts/auth';
export { createLuthAuthClient as createCanonicalAuthClient } from '@dinilmusick/gutts/auth';
