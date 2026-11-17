import {
  resolveClientOrigin,
  resolveClientEnvironment,
} from '@dinilmusick/gutts/auth';

export {
  DEFAULT_LUTH_URL,
  LuthAuthClient,
  createLuthAuthClient,
} from '@dinilmusick/gutts/auth';

export type {
  DeploymentEnvironment,
  EmailSignInCredentials,
  EmailSignUpData,
  GoogleSignInOptions,
  LuthAuthClientConfig,
  LuthAuthTokenStore,
  LuthSession,
  LuthUser,
  LuthSessionResult,
  RegisterApplicationResult,
} from '@dinilmusick/gutts/auth';

export { LuthAuthError } from '@dinilmusick/gutts/auth';

export const resolveLuthOrigin = resolveClientOrigin;
export const resolveLuthEnvironment = resolveClientEnvironment;
