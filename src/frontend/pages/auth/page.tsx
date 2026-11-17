import React, { useState } from "react";
import { AuthPage as FloksAuthPage, type AuthPageProps as FloksAuthPageProps, BaseButton } from "@ultrst-armada/floks";

export interface AuthPageProps {
  onLogin: FloksAuthPageProps["onLogin"];
  onRegister: FloksAuthPageProps["onRegister"];
  onGoogleSignIn?: FloksAuthPageProps["onGoogleSignIn"];
  enableGoogleSignIn?: boolean;
  onSuccess?: FloksAuthPageProps["onSuccess"];
  systemDbStatus?: unknown;
  guestAvailable?: boolean;
  onContinueAsGuest?: () => Promise<{ success: boolean; error?: string }>;
}

export function AuthPage({ onLogin, onRegister, onGoogleSignIn, enableGoogleSignIn = true, onSuccess, guestAvailable, onContinueAsGuest }: AuthPageProps) {
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState("");
  const continueAsGuest = async () => {
    if (!onContinueAsGuest) return;
    setGuestLoading(true); setGuestError("");
    try {
      const result = await onContinueAsGuest();
      if (!result.success) setGuestError(result.error || "Guest access is unavailable.");
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : "Guest access is unavailable.");
    } finally { setGuestLoading(false); }
  };
  return (
    <>
      <FloksAuthPage
        appName="Aiko"
        onLogin={onLogin}
        onRegister={onRegister}
        onGoogleSignIn={onGoogleSignIn}
        enableGoogleSignIn={enableGoogleSignIn}
        onSuccess={onSuccess}
      />
      {onContinueAsGuest && (
        <div className="fixed bottom-5 left-0 right-0 z-[60] flex flex-col items-center gap-2 pointer-events-none">
          {guestError && <p className="pointer-events-auto rounded border border-rose-500/40 bg-[var(--skipo-surface,#121722)] px-3 py-2 text-xs text-rose-300">{guestError}</p>}
          <div className="pointer-events-auto">
            <BaseButton size="sm" variant="secondary" disabled={guestLoading} onClick={() => void continueAsGuest()}>
              {guestLoading ? "Opening Guest Session..." : "Continue as Guest"}
            </BaseButton>
          </div>
        </div>
      )}
    </>
  );
}

export default AuthPage;
