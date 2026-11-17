'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LuthAuthPage } from '../../src/frontend/pages/auth/LuthAuthPage';
import { getSkipoApplicationId } from '../../src/libraries/client/luthAuthClient';

export default function LoginPage() {
  const router = useRouter();
  return (
    <LuthAuthPage
      applicationId={getSkipoApplicationId()}
      appName="MY APP"
      onAuthenticated={() => router.push('/')}
      onContinueAsGuest={() => router.push('/')}
    />
  );
}
