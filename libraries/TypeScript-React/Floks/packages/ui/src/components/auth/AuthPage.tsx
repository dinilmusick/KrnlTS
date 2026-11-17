import React, { useEffect, useId, useMemo, useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton.js';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from '../../frnl/store.js';
import { frnlButton } from '../../frnl/frnlButton.js';
import { frnlTextInput } from '../../frnl/frnlTextInput.js';

export const AUTH_PAGE_REQUIRED_SERVICES = ['auth'] as const;

export interface AuthResult { success: boolean; error?: string; user?: unknown; redirectUrl?: string; }
export interface AuthPageProps {
  appName?: string;
  appSubtitle?: string;
  footerText?: string;
  appIcon?: string | React.ReactNode;
  onLogin: (email: string, password: string) => Promise<AuthResult>;
  onRegister: (input: { name: string; email: string; password: string }) => Promise<AuthResult>;
  onSuccess?: (result: AuthResult) => void;
  onGoogleSignIn?: () => Promise<AuthResult>;
  enableGoogleSignIn?: boolean;
  onSwitchToAdmin?: () => void;
  onContinueAsGuest?: () => void;
  authError?: string | null;
}

export const authPageDefinition = defineFrnlComponent({
  name: 'AuthPage',
  states: {
    idle: { name: 'idle', events: { login: { functionId: 'AuthPage.idle.login' }, register: { functionId: 'AuthPage.idle.register' } }, visualParameters: {}, phases: { sustainPhase: { visualDefinition: { parameters: {} } } } },
    loading: { name: 'loading', events: {}, visualParameters: { opacity: 0.75 }, phases: { sustainPhase: { visualDefinition: { parameters: {} } } } },
    error: { name: 'error', events: { retry: { functionId: 'AuthPage.error.retry' } }, visualParameters: {}, phases: { sustainPhase: { visualDefinition: { parameters: {} } } } },
  },
});

export const AuthPage: React.FC<AuthPageProps> = ({
  appName = 'SKIPO',
  appSubtitle = 'WORKSPACE',
  footerText,
  appIcon,
  onLogin,
  onRegister,
  onSuccess,
  onGoogleSignIn,
  enableGoogleSignIn = true,
  onSwitchToAdmin,
  onContinueAsGuest,
  authError,
}) => {
  const store = useFloksFrnlStore();
  const generated = useId().replace(/[:/]/g, '');
  const componentId = `AuthPage.${generated}`;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [iconError, setIconError] = useState(false);
  const iconSrc = typeof appIcon === 'string' ? appIcon : '/src/frontend/assets/app-icon.svg';
  const emailValid = email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => { setError(authError ?? null); }, [authError]);

  const handlers = useMemo(() => ({
    'AuthPage.idle.login': () => {},
    'AuthPage.idle.register': () => {},
    'AuthPage.error.retry': () => setError(null),
  }), []);
  const frnl = useFrnlComponent({
    id: componentId,
    definition: authPageDefinition,
    store,
    state: error ? 'error' : loading ? 'loading' : 'idle',
    properties: { mode, appName },
    handlers,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return setError('Email address is required.');
    if (!emailValid) return setError('Enter a valid email address.');
    if (!password) return setError('Password is required.');
    if (mode === 'register' && !name.trim()) return setError('Display name is required.');
    setLoading(true); setError(null);
    try {
      const result = mode === 'login'
        ? await onLogin(cleanEmail, password)
        : await onRegister({ name: name.trim(), email: cleanEmail, password });
      if (!result.success) throw new Error(result.error || 'Authentication failed.');
      onSuccess?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id={componentId}
      data-frnl-component="AuthPage"
      data-frnl-state={frnl.state}
      className="min-h-screen h-screen w-screen bg-[var(--skipo-bg)] text-[var(--skipo-text)] font-mono flex flex-col justify-between overflow-hidden"
      style={{ minHeight: '100vh', height: '100vh', width: '100vw' }}
    >
      <header className="border-b-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {appIcon && typeof appIcon !== 'string' ? (
            <div className="w-8 h-8 shrink-0 flex items-center justify-center">{appIcon}</div>
          ) : !iconError ? (
            <div className="w-8 h-8 shrink-0 flex items-center justify-center overflow-hidden rounded bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]">
              <img
                src={iconSrc}
                alt={appName}
                className="w-6 h-6 object-contain shrink-0"
                onError={() => setIconError(true)}
              />
            </div>
          ) : (
            <div className="w-8 h-8 shrink-0 bg-[var(--skipo-accent)] text-black font-black flex items-center justify-center text-xs rounded select-none">
              ▲
            </div>
          )}
          <div>
            <span className="text-sm font-black uppercase tracking-wider">{appName}</span>
            <span className="ml-2 text-[10px] text-[var(--skipo-text-muted)] tracking-tight">{appSubtitle}</span>
          </div>
        </div>
        {onSwitchToAdmin && <button type="button" onClick={onSwitchToAdmin} className="px-3 py-1.5 text-[10px] font-black border-2 border-[var(--skipo-accent)] text-[var(--skipo-accent)] flex items-center gap-1.5"><Shield size={13} /> ADMIN <ArrowRight size={13} /></button>}
      </header>
      <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="w-full max-w-md border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[6px_6px_0px_var(--skipo-border-color)] p-6 my-auto">
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button type="button" onClick={() => { setMode('login'); setError(null); }} className={`py-2 text-[10px] font-black border-2 transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 rounded-sm ${mode === 'login' ? 'bg-[var(--skipo-accent)] text-[var(--skipo-accent-fg,#000000)] border-[var(--skipo-accent)] shadow-[2px_2px_0px_var(--skipo-border-color)]' : 'bg-[var(--skipo-surface)] text-[var(--skipo-text-muted)] border-[var(--skipo-border-color)] hover:text-[var(--skipo-text)] hover:bg-[var(--skipo-surface-hover)]'}`}><LogIn size={13} /> SIGN IN</button>
            <button type="button" onClick={() => { setMode('register'); setError(null); }} className={`py-2 text-[10px] font-black border-2 transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 rounded-sm ${mode === 'register' ? 'bg-[var(--skipo-accent)] text-[var(--skipo-accent-fg,#000000)] border-[var(--skipo-accent)] shadow-[2px_2px_0px_var(--skipo-border-color)]' : 'bg-[var(--skipo-surface)] text-[var(--skipo-text-muted)] border-[var(--skipo-border-color)] hover:text-[var(--skipo-text)] hover:bg-[var(--skipo-surface-hover)]'}`}><UserPlus size={13} /> CREATE ACCOUNT</button>
          </div>
          {error && <div className="mb-4 p-3 border-2 border-red-500/80 bg-red-950/30 text-red-300 text-xs flex items-center gap-2"><AlertCircle size={14} />{error}</div>}
          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && React.createElement(frnlTextInput, { id: componentId + '.name', label: 'Full Name', value: name, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value) })}
            <div>
              {React.createElement(frnlTextInput, { id: componentId + '.email', label: 'Email Address', value: email, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), type: 'email', autoComplete: 'username' })}
              {!emailValid && <div className="mt-1 text-[10px] text-red-400">Enter a valid email address.</div>}
            </div>
            <div>
              {React.createElement(frnlTextInput, { id: componentId + '.password', label: 'Password', value: password, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), type: showPassword ? 'text' : 'password', autoComplete: mode === 'login' ? 'current-password' : 'new-password', trailingIcon: <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={13} /> : <Eye size={13} />}</button> })}
            </div>
            {React.createElement(frnlButton, { type: 'submit', disabled: loading, loading, variant: 'accent', size: 'lg', className: 'w-full', icon: <ArrowRight size={13} /> }, mode === 'login' ? 'SIGN IN TO WORKSPACE' : 'CREATE ACCOUNT')}
          </form>
          {onGoogleSignIn && enableGoogleSignIn && (
            <>
              <div className="my-4 flex items-center gap-2 text-[9px] text-[var(--skipo-text-muted)]"><span className="h-px flex-1 bg-[var(--skipo-border-color)]" /> OR <span className="h-px flex-1 bg-[var(--skipo-border-color)]" /></div>
              <GoogleSignInButton
                label={mode === 'register' ? 'SIGN UP WITH GOOGLE' : 'CONTINUE WITH GOOGLE'}
                onSignIn={async () => {
                  setGoogleLoading(true);
                  setError(null);
                  try {
                    let result: AuthResult;
                    if (!onGoogleSignIn) {
                      throw new Error('Canonical Luth Google sign-in handler is not configured.');
                    }
                    result = await onGoogleSignIn();
                    if (!result.success) throw new Error(result.error || 'Google sign-in failed.');
                    onSuccess?.(result);
                  } catch (error) {
                    setError(error instanceof Error ? error.message : 'Google sign-in failed.');
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                disabled={loading}
                loading={googleLoading}
              />
            </>
          )}
          {onContinueAsGuest && (
            <>
              <div className="my-4 flex items-center gap-2 text-[9px] text-[var(--skipo-text-muted)]"><span className="h-px flex-1 bg-[var(--skipo-border-color)]" /> OR <span className="h-px flex-1 bg-[var(--skipo-border-color)]" /></div>
              <button type="button" onClick={onContinueAsGuest} disabled={loading} className="w-full py-2 text-[10px] font-black border-2 border-[var(--skipo-border-color)] text-[var(--skipo-text-muted)] bg-[var(--skipo-surface)] hover:text-[var(--skipo-text)] hover:bg-[var(--skipo-surface-hover)] transition-all cursor-pointer select-none rounded-sm">CONTINUE AS GUEST</button>
            </>
          )}
          <p className="mt-5 pt-3 border-t border-[var(--skipo-border-color)] text-center text-[10px] text-[var(--skipo-text-muted)]">{footerText || `${appName} WORKSPACE SYSTEM`}</p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
