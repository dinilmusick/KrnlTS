'use client';

import React from 'react';
import { LuthAuthPage as FloksLuthAuthPage } from '@ultrst-armada/floks/auth';

export interface LuthAuthPageProps {
  applicationId: string;
  appName: string;
  onAuthenticated?: (user: unknown) => void;
  onContinueAsGuest?: () => void;
}

/** Skipo supplies application identity; Floks owns the complete Luth auth lifecycle. */
export function LuthAuthPage({ applicationId, appName, onAuthenticated, onContinueAsGuest }: LuthAuthPageProps) {
  return (
    <FloksLuthAuthPage
      ecosystemId="ultrst-armada"
      applicationId={applicationId}
      appName={appName}
      onAuthenticated={onAuthenticated as any}
      onContinueAsGuest={onContinueAsGuest}
    />
  );
}

export default LuthAuthPage;
