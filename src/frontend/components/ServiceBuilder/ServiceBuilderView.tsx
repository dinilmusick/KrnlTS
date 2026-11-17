'use client';

/**
 * @file ServiceBuilderView.tsx
 * @description Master Service Builder view orchestrator.
 * Inherits BaseIconButton for all controls, adhering to Skipo icon-only protocol.
 * Conforms to Srkl-spec.md Section 14 & Skipo code limits (<200 lines).
 */

import React, { useState } from 'react';
import { Wrench, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { ServiceBuilderStep1 } from './ServiceBuilderStep1';
import { ServiceBuilderStep2 } from './ServiceBuilderStep2';
import { ServiceBuilderStep3 } from './ServiceBuilderStep3';
import { ProviderTemplatesBar } from './ProviderTemplatesBar';
import {
  ActionDefinition,
  AuthType,
  CredentialField,
  EndpointDefinition,
  ResourceDefinition,
  ServiceDefinition,
} from '@/libraries/types/srkl';
import { BaseIconButton } from '../common/BaseIconButton';

export function ServiceBuilderView(): React.ReactElement {
  const { registerServiceDefinition, setActiveTab } = useHub();
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [authType, setAuthType] = useState<AuthType>('API_KEY');
  const [credentialFields, setCredentialFields] = useState<CredentialField[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointDefinition[]>([]);
  const [actions, setActions] = useState<ActionDefinition[]>([]);
  const [resources, setResources] = useState<ResourceDefinition[]>([]);
  const [pollingInterval, setPollingInterval] = useState(60);

  const handleApplyTemplate = (tpl: ServiceDefinition) => {
    setName(tpl.name);
    setIdentifier(tpl.identifier);
    setDescription(tpl.description);
    setVersion(tpl.version);
    setAuthType(tpl.authType);
    setCredentialFields([...tpl.credentialFields]);
    setEndpoints([...tpl.endpoints]);
    setActions([...tpl.actions]);
    setResources([...tpl.resources]);
    setPollingInterval(tpl.pollingIntervalSeconds || 60);
  };

  const fullDefinition: ServiceDefinition = {
    name,
    identifier,
    description,
    version,
    authType,
    credentialFields,
    endpoints,
    actions,
    resources,
    pollingIntervalSeconds: pollingInterval,
  };

  const handleRegister = () => {
    registerServiceDefinition(fullDefinition);
  };

  const handleReset = () => {
    setName('');
    setIdentifier('');
    setDescription('');
    setCredentialFields([]);
    setEndpoints([]);
    setActions([]);
    setResources([]);
  };

  return (
    <div id="srkl-builder-view" className="space-y-6 max-w-5xl mx-auto w-full font-mono pb-16 animate-fade-in select-none">
      {/* Header Row with Icon-Only Controls */}
      <div
        className="flex items-center justify-between pb-3 border-b-2"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 border-2 flex items-center justify-center shadow-sm"
            style={{
              borderColor: 'var(--skipo-accent)',
              backgroundColor: 'var(--skipo-matte-bg)',
              color: 'var(--skipo-accent)',
              borderRadius: 'var(--skipo-radius-sm)',
            }}
          >
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-sm font-black tracking-wider uppercase"
              style={{ color: 'var(--skipo-text)' }}
            >
              SERVICE DEFINITION BUILDER
            </h1>
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color: 'var(--skipo-text-muted)' }}
            >
              STEP {currentStep} OF 3
            </span>
          </div>
        </div>

        {/* Stepper Buttons: BaseIconButton */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((step) => (
            <BaseIconButton
              key={step}
              tooltip={`Go to Step ${step}`}
              icon={<span className="font-mono font-bold text-xs">{step}</span>}
              variant={currentStep === step ? 'primary' : 'secondary'}
              active={currentStep === step}
              size="sm"
              onClick={() => setCurrentStep(step)}
            />
          ))}
        </div>
      </div>

      {currentStep === 1 && (
        <>
          <ProviderTemplatesBar
            onApplyTemplate={handleApplyTemplate}
            onReset={handleReset}
            hasInput={Boolean(name || identifier)}
          />

          <ServiceBuilderStep1
            name={name} setName={setName}
            identifier={identifier} setIdentifier={setIdentifier}
            description={description} setDescription={setDescription}
            version={version} setVersion={setVersion}
            authType={authType} setAuthType={setAuthType}
            credentialFields={credentialFields} setCredentialFields={setCredentialFields}
          />
        </>
      )}

      {currentStep === 2 && (
        <ServiceBuilderStep2
          endpoints={endpoints} setEndpoints={setEndpoints}
          actions={actions} setActions={setActions}
        />
      )}

      {currentStep === 3 && (
        <ServiceBuilderStep3
          resources={resources} setResources={setResources}
          pollingInterval={pollingInterval} setPollingInterval={setPollingInterval}
          fullDefinition={fullDefinition}
          onRegisterService={handleRegister}
        />
      )}

      {/* Stepper Navigation: Strictly BaseIconButton */}
      <div
        className="flex justify-between items-center pt-4 border-t"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        <BaseIconButton
          tooltip="Previous Step"
          icon={<ChevronLeft className="w-4 h-4" />}
          variant="secondary"
          size="md"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
        />

        {currentStep < 3 ? (
          <BaseIconButton
            tooltip="Next Step"
            icon={<ChevronRight className="w-4 h-4" />}
            variant="primary"
            size="md"
            onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1))}
          />
        ) : (
          <BaseIconButton
            tooltip="Return to Services Hub"
            icon={<CheckCircle2 className="w-4 h-4" />}
            variant="primary"
            size="md"
            onClick={() => setActiveTab('SERVICES')}
          />
        )}
      </div>
    </div>
  );
}
