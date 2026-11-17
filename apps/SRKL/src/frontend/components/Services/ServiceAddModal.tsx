/**
 * @file ServiceAddModal.tsx
 * @description Dialog inheriting from BaseModal for selecting service type or importing JSON.
 * Strictly adheres to Skipo icon-only buttons and component inheritance.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Server, FileJson, Layers, ArrowRight } from 'lucide-react';
import { ServiceDefinition, ServiceGroup } from '@/libraries/types/srkl';
import { ServiceRegistry } from '@/libraries/services/registry';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceConfigureForm } from './ServiceConfigureForm';
import { ServiceImportTab } from './ServiceImportTab';
import { getServiceVisualConfig } from './serviceIcons';
import { BaseModal } from '../common/BaseModal';
import { BaseIconButton } from '../common/BaseIconButton';

interface ServiceAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDefinitions: ServiceDefinition[];
  groups?: ServiceGroup[];
  defaultGroupId?: string;
  onAddAccount: (account: ServiceAccount, definition?: ServiceDefinition) => Promise<void> | void;
  initialTab?: 'choose' | 'import';
}

export function ServiceAddModal({
  isOpen,
  onClose,
  availableDefinitions,
  groups = [],
  defaultGroupId,
  onAddAccount,
  initialTab = 'choose',
}: ServiceAddModalProps): React.ReactElement | null {
  const [activeTab, setActiveTab] = useState<'choose' | 'import'>(initialTab);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);

  const templates = ServiceRegistry.getAvailableTemplates();
  const templateMap = new Map<string, ServiceDefinition>();
  for (const t of templates) templateMap.set(t.identifier, t);
  for (const def of availableDefinitions) {
    if (!templateMap.has(def.identifier)) {
      templateMap.set(def.identifier, def);
    }
  }
  const allServices = Array.from(templateMap.values());

  const handleAccountCreated = async (account: ServiceAccount) => {
    await onAddAccount(account, selectedService || undefined);
    onClose();
  };

  const handleImportCompleted = async (service: ServiceDefinition, account: ServiceAccount) => {
    await onAddAccount(account, service);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="ADD NEW SERVICE TILE"
      icon={<Server className="w-4 h-4 text-amber-400" />}
      maxWidth="2xl"
    >
      {/* Tab Switcher: Strictly Icon-Only Controls with Tooltips */}
      {!selectedService && (
        <div className="flex items-center justify-center gap-2 border-b border-neutral-800 pb-3">
          <BaseIconButton
            tooltip="Choose Service Provider from Catalog"
            icon={<Layers className="w-4 h-4" />}
            variant={activeTab === 'choose' ? 'primary' : 'secondary'}
            active={activeTab === 'choose'}
            size="md"
            onClick={() => setActiveTab('choose')}
          />
          <BaseIconButton
            tooltip="Import Service Bundle JSON Definition"
            icon={<FileJson className="w-4 h-4" />}
            variant={activeTab === 'import' ? 'primary' : 'secondary'}
            active={activeTab === 'import'}
            size="md"
            onClick={() => setActiveTab('import')}
          />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'import' ? (
        <ServiceImportTab
          onImportComplete={handleImportCompleted}
          onCancel={onClose}
        />
      ) : selectedService ? (
        <ServiceConfigureForm
          service={selectedService}
          groups={groups}
          defaultGroupId={defaultGroupId}
          onBack={() => setSelectedService(null)}
          onSubmit={handleAccountCreated}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {allServices.map((srv) => {
            const visual = getServiceVisualConfig(srv.identifier);
            const IconComp = visual.icon;

            return (
              <div
                key={srv.identifier}
                onClick={() => setSelectedService(srv)}
                className="p-3 border border-neutral-800 hover:border-amber-500 bg-neutral-950/70 hover:bg-neutral-950 cursor-pointer transition-all group flex flex-col justify-between select-none shadow-[2px_2px_0px_#000]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 border flex items-center justify-center ${visual.accentBorder} ${visual.accentBg}`}>
                        <IconComp className={`w-4 h-4 ${visual.accentText}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-100 group-hover:text-amber-300 transition-colors uppercase text-xs">
                          {srv.name}
                        </h3>
                        <span className="text-[9px] text-neutral-500 uppercase">{visual.badge}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">v{srv.version}</span>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-500 group-hover:text-amber-400 transition-colors">
                  <span>{srv.credentialFields.length} credentials</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BaseModal>
  );
}
