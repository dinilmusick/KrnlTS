/**
 * Canonical account-provider compatibility type.
 *
 * Auth is owned by Luth; this alias exists only for control-plane APIs that
 * historically accepted a BaseAccountProvider.
 */
export {
  LuthAuthClient as BaseAccountProvider,
  createLuthAuthClient as createBaseAccountProvider,
} from '@dinilmusick/gutts';
