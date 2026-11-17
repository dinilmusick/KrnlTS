/**
 * @file ServiceBuilderStep1.tsx
 * @description Service Builder Step 1: Identity & Authentication schema.
 * Conforms to Srkl-spec.md Section 14 (Steps 1 & 2).
 * File size < 200 lines strictly.
 */

import React from 'react';
import { BaseInput } from '@skipo/ui';
import { BrutalistSelect } from '../common/BrutalistSelect';
import { AuthType, CredentialField } from '@/libraries/types/srkl';
import { CredentialsSection } from './CredentialsSection';

interface Step1Props {
  name: string;
  setName: (v: string) => void;
  identifier: string;
  setIdentifier: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  version: string;
  setVersion: (v: string) => void;
  authType: AuthType;
  setAuthType: (v: AuthType) => void;
  credentialFields: CredentialField[];
  setCredentialFields: React.Dispatch<React.SetStateAction<CredentialField[]>>;
}

export function ServiceBuilderStep1({
  name,
  setName,
  identifier,
  setIdentifier,
  description,
  setDescription,
  version,
  setVersion,
  authType,
  setAuthType,
  credentialFields,
  setCredentialFields,
}: Step1Props): React.ReactElement {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-3 border border-neutral-800 bg-neutral-950/60 rounded-sm">
        <h3 className="text-sm font-semibold text-neutral-200 mb-1">1. Service Identity</h3>
        <p className="text-[11px] text-neutral-400 mb-3">Core service naming and metadata.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-neutral-400 mb-1">Service Name</label>
            <BaseInput type="text" placeholder="e.g. Supabase, Resend"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full" />
          </div>
          <div>
            <label className="block text-neutral-400 mb-1">Slug Identifier</label>
            <BaseInput type="text" placeholder="e.g. supabase-db"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-neutral-400 mb-1">Description</label>
            <BaseInput type="text" placeholder="Service capability overview..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full" />
          </div>
          <div>
            <label className="block text-neutral-400 mb-1">Semantic Version</label>
            <BaseInput type="text" value={version} onChange={(e) => setVersion(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-neutral-400 mb-1">Auth Type</label>
            <BrutalistSelect value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthType)} inspectionLabel="Auth Type" className="w-full">
              <option value="API_KEY">API_KEY</option>
              <option value="BEARER_TOKEN">BEARER_TOKEN</option>
              <option value="BASIC">BASIC</option>
              <option value="OAUTH2">OAUTH2</option>
              <option value="CUSTOM">CUSTOM</option>
            </BrutalistSelect>
          </div>
        </div>
      </div>

      <CredentialsSection
        credentialFields={credentialFields}
        setCredentialFields={setCredentialFields}
      />
    </div>
  );
}
