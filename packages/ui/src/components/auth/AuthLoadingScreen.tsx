import React from 'react';

export interface AuthLoadingScreenProps {
  label?: string;
  className?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  label = 'CONNECTING WORKSPACE...',
  className = '',
}) => (
  <div
    data-frnl-component="AuthLoadingScreen"
    className={`min-h-screen h-screen w-screen flex flex-col items-center justify-center bg-[var(--skipo-bg)] text-[var(--skipo-text)] font-mono ${className}`}
  >
    <div
      aria-hidden="true"
      className="w-8 h-8 border-2 border-[var(--skipo-border-color)] border-t-[var(--skipo-accent)] rounded-full animate-spin"
    />
    <span className="mt-4 text-[11px] tracking-[0.15em] text-[var(--skipo-text-muted)]">
      {label}
    </span>
  </div>
);

export default AuthLoadingScreen;
