/**
// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

 * ASCII Architecture Flowchart: useKeyTargeting
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize useKeyTargeting    │
 *   └──────────────────────────────────┘
 */

import { useState, useEffect } from 'react';
import { ApiKeyEntry, ProviderId } from '../../../types/app.js';


// ════ USEKEYTARGETING IMPLEMENTATION ══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function useKeyTargeting(
  keys: ApiKeyEntry[],
  emails: string[],
  initialProviderId?: ProviderId,
  targetKeyId?: string,
  highlightNonce?: number,
  setActiveTab?: (tab: 'single' | 'email') => void,
  setSelectedFilter?: (filter: ProviderId | 'all') => void
) {
  const [activeHighlightKeyId, setActiveHighlightKeyId] = useState<string | null>(null);
  const [activeHighlightProviderId, setActiveHighlightProviderId] = useState<ProviderId | null>(null);

  const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  useEffect(() => {
    if (!initialProviderId && !targetKeyId) {
      setActiveHighlightKeyId(null);
      setActiveHighlightProviderId(null);
      return;
    }
    if (targetKeyId) {
      const foundKey = keys.find(k => k.id === targetKeyId);
      if (foundKey) {
        setActiveHighlightKeyId(foundKey.id);
        setActiveHighlightProviderId(null);
        if (isEmail(foundKey.label) || emails.includes(foundKey.label)) {
          setActiveTab?.('email');
        } else {
          setActiveTab?.('single');
          setSelectedFilter?.(foundKey.providerId);
        }
        const timer = setTimeout(() => setActiveHighlightKeyId(null), 6000);
        return () => clearTimeout(timer);
      }
    }
    if (initialProviderId) {
      const existing = keys.find(k => k.providerId === initialProviderId);
      if (existing) {
        setActiveHighlightKeyId(existing.id);
        setActiveHighlightProviderId(null);
        if (isEmail(existing.label) || emails.includes(existing.label)) setActiveTab?.('email');
        else { setActiveTab?.('single'); setSelectedFilter?.(initialProviderId); }
      } else {
        setActiveHighlightKeyId(null);
        setActiveHighlightProviderId(initialProviderId);
        if (emails.length > 0) setActiveTab?.('email');
        else { setActiveTab?.('single'); setSelectedFilter?.(initialProviderId); }
      }
      const timer = setTimeout(() => { setActiveHighlightKeyId(null); setActiveHighlightProviderId(null); }, 6000);
      return () => clearTimeout(timer);
    }
  }, [initialProviderId, targetKeyId, highlightNonce, keys, emails]);

  return {
    activeHighlightKeyId,
    activeHighlightProviderId,
    isEmail
  };
}