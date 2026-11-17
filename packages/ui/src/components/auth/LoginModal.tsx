import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { BaseButton } from '../base/BaseButton.js';
import { BaseInput } from '../base/BaseInput.js';
import { GoogleSignInButton } from './GoogleSignInButton.js';
import { useLuthAuth } from './LuthAuthPage.js';
import type { LuthUser } from './LuthAuthClient.js';

export interface LoginModalProps {
  ecosystemId: string;
  applicationId: string;
  luthUrl?: string;
  appName?: string;
  onSuccess: (user: LuthUser) => void;
  defaultEmail?: string;
  onClose?: () => void;
}

/** Modal UI backed exclusively by the canonical Luth session authority through Kloks. */
export const LoginModal: React.FC<LoginModalProps> = ({
  ecosystemId,
  applicationId,
  luthUrl,
  appName = 'Ecosystem App',
  onSuccess,
  defaultEmail = '',
  onClose,
}) => {
  const auth = useLuthAuth({ ecosystemId, applicationId, luthUrl });
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const deliveredUserId = useRef<string | null>(null);

  useEffect(() => {
    if (auth.session.authenticated && auth.user && deliveredUserId.current !== auth.user.id) {
      deliveredUserId.current = auth.user.id;
      onSuccess(auth.user);
    }
  }, [auth.session.authenticated, auth.user, onSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    try {
      if (isRegister) await auth.signUp({ name: name.trim(), email: email.trim(), password });
      else await auth.signIn({ email: email.trim(), password });
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Authentication failed.');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setLocalError(null);
    try {
      const result = await auth.signInWithGoogle();
      const payload = result && typeof result === 'object' ? result as Record<string, unknown> : {};
      if (typeof payload.url === 'string' && typeof window !== 'undefined') {
        window.location.assign(payload.url);
        return;
      }
      await auth.refresh();
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const error = localError || auth.error;

  if (auth.initializing) {
    return (
      <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-mono text-xs text-white">
        CONNECTING TO LUTH...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono p-4" onWheel={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
      <div className="w-full max-w-md p-6 border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] text-[var(--skipo-text)] shadow-2xl rounded-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--skipo-border-color)]">
          <span className="font-black text-sm tracking-wider uppercase">{appName} Authentication</span>
          {onClose && <button type="button" onClick={onClose} aria-label="Close authentication" className="text-xs">CLOSE</button>}
        </div>
        {error && <div role="alert" className="p-3 border border-red-500/60 bg-red-500/10 text-red-300 text-xs rounded flex items-start gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
          {isRegister && <div><label className="block text-[10px] font-black uppercase mb-1">Full Name *</label><BaseInput type="text" value={name} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)} required placeholder="Your name" autoComplete="name" /></div>}
          <div><label className="block text-[10px] font-black uppercase mb-1">Email Address *</label><BaseInput type="email" value={email} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} required placeholder="user@example.com" autoComplete="username" /></div>
          <div><label className="block text-[10px] font-black uppercase mb-1">Password *</label><BaseInput type="password" value={password} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} required autoComplete={isRegister ? 'new-password' : 'current-password'} /></div>
          <BaseButton variant="accent" size="md" type="submit" disabled={auth.loading || googleLoading} className="w-full flex items-center justify-center gap-2">
            <span>{auth.loading ? 'AUTHENTICATING...' : isRegister ? 'REGISTER & ENTER' : 'SIGN IN'}</span><ArrowRight size={14} />
          </BaseButton>
        </form>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[9px] text-[var(--skipo-text-muted)]"><span className="h-px flex-1 bg-[var(--skipo-border-color)]" /> OR <span className="h-px flex-1 bg-[var(--skipo-border-color)]" /></div>
          <GoogleSignInButton disabled={auth.loading || googleLoading} loading={googleLoading} onSignIn={handleGoogleSignIn} />
        </div>
        <div className="pt-2 border-t border-[var(--skipo-border-color)]/60 flex items-center justify-between text-[11px]">
          <button type="button" onClick={() => { setIsRegister(!isRegister); setLocalError(null); }} className="text-[var(--skipo-accent)] hover:underline cursor-pointer">
            {isRegister ? 'Already have an account? Sign In' : 'Create new account'}
          </button>
          <span className="text-[10px] text-[var(--skipo-text-muted)]">SECURED BY LUTH</span>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
