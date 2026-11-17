'use client';
import React, { forwardRef, useState } from 'react';
import { BaseTooltip } from './BaseTooltip.js';
import '../../styles/base.css';

export const KNOWN_CREDENTIAL_URLS: Record<string, { name: string; url: string }> = {
  openai: { name: 'OpenAI API Keys', url: 'https://platform.openai.com/api-keys' },
  anthropic: { name: 'Anthropic Console', url: 'https://console.anthropic.com/settings/keys' },
  google: { name: 'Google AI Studio', url: 'https://aistudio.google.com/app/apikey' },
  gemini: { name: 'Google AI Studio', url: 'https://aistudio.google.com/app/apikey' },
  backblaze: { name: 'Backblaze B2 App Keys', url: 'https://secure.backblaze.com/app_keys.htm' },
  b2: { name: 'Backblaze B2 App Keys', url: 'https://secure.backblaze.com/app_keys.htm' },
  cloudflare: { name: 'Cloudflare R2 API Tokens', url: 'https://dash.cloudflare.com/?to=/:account/r2/api-tokens' },
  r2: { name: 'Cloudflare R2 API Tokens', url: 'https://dash.cloudflare.com/?to=/:account/r2/api-tokens' },
  aws: { name: 'AWS IAM Security Credentials', url: 'https://console.aws.amazon.com/iam/home#/security_credentials' },
  s3: { name: 'AWS IAM Security Credentials', url: 'https://console.aws.amazon.com/iam/home#/security_credentials' },
  supabase: { name: 'Supabase API Settings', url: 'https://supabase.com/dashboard/project/_/settings/api' },
  neon: { name: 'Neon API Keys', url: 'https://console.neon.tech/app/settings/api-keys' },
  github: { name: 'GitHub Personal Access Tokens', url: 'https://github.com/settings/tokens' },
  openrouter: { name: 'OpenRouter Keys', url: 'https://openrouter.ai/keys' },
};

export interface CredentialFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  serviceId?: string;
  credentialUrl?: string;
  serviceLabel?: string;
}

/**
 * CredentialField — Secure credential input with an integrated direct link to the external service's key management portal.
 */
export const CredentialField = forwardRef<HTMLInputElement, CredentialFieldProps>(({
  serviceId,
  credentialUrl,
  serviceLabel,
  className = '',
  ...props
}, ref) => {
  const [showSecret, setShowSecret] = useState(false);

  const known = serviceId ? KNOWN_CREDENTIAL_URLS[serviceId.toLowerCase()] : undefined;
  const resolvedUrl = credentialUrl || known?.url;
  const resolvedLabel = serviceLabel || known?.name || (serviceId ? serviceId.toUpperCase() : 'CREDENTIALS');

  return (
    <div
      className={`skipo-credential-field ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <input
        ref={ref}
        type={showSecret ? 'text' : 'password'}
        className="skipo-input"
        style={{ paddingRight: resolvedUrl ? '56px' : '32px' }}
        {...props}
      />

      <div
        style={{
          position: 'absolute',
          right: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        {/* Toggle secret visibility */}
        <BaseTooltip content={showSecret ? 'HIDE SECRET CREDENTIAL' : 'SHOW SECRET CREDENTIAL'}>
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            aria-label={showSecret ? 'Hide secret' : 'Show secret'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--skipo-text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showSecret ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </BaseTooltip>

        {/* External service portal link */}
        {resolvedUrl && (
          <BaseTooltip content={`GET CREDENTIALS: OPEN ${resolvedLabel.toUpperCase()} (EXTERNAL LINK)`}>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Get ${resolvedLabel} credentials`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                color: 'var(--skipo-accent)',
                textDecoration: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </BaseTooltip>
        )}
      </div>
    </div>
  );
});

CredentialField.displayName = 'CredentialField';
