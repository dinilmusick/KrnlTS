import { describe, expect, it } from 'vitest';
import {
  AuthLoadingScreen,
  LoginModal,
  LuthAuthPage,
  LuthProtectedRoute,
  useLuthAuth,
} from './index.js';

describe('Floks public authentication exports', () => {
  it('resolves integrated auth UI, lifecycle hook, and protected route from the package subpath', () => {
    expect(AuthLoadingScreen).toBeTypeOf('function');
    expect(LoginModal).toBeTypeOf('function');
    expect(LuthAuthPage).toBeTypeOf('function');
    expect(LuthProtectedRoute).toBeTypeOf('function');
    expect(useLuthAuth).toBeTypeOf('function');
  });
});
