import React from 'react';
import { LuthAuthPage, type LuthAuthPageProps, type UseLuthAuthResult } from './LuthAuthPage.js';

export interface LuthProtectedRouteProps extends Omit<
  LuthAuthPageProps,
  'authenticatedContent' | 'unauthenticatedContent' | 'loadingContent'
> {
  children: React.ReactNode | ((auth: UseLuthAuthResult) => React.ReactNode);
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/** Protects application content using the same canonical Luth session lifecycle as LuthAuthPage. */
export const LuthProtectedRoute: React.FC<LuthProtectedRouteProps> = ({
  ecosystemId,
  applicationId,
  luthUrl,
  children,
  fallback,
  loadingFallback,
  ...presentation
}) => (
  <LuthAuthPage
    {...presentation}
    ecosystemId={ecosystemId}
    applicationId={applicationId}
    luthUrl={luthUrl}
    authenticatedContent={children}
    unauthenticatedContent={fallback}
    loadingContent={loadingFallback}
  />
);

export default LuthProtectedRoute;
