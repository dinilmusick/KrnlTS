/**
 * @file MainContent.tsx
 * @description Main content view switcher for SRKL.
 * Adheres to Skipo code limits (<200 lines).
 */

import React from 'react';
import { useHub } from '../../context/HubContext';
import { ServicesView } from '../Services/ServicesView';
import { ServiceBuilderView } from '../ServiceBuilder/ServiceBuilderView';
import { ActivityView } from '../Activity/ActivityView';
import { SettingsView } from '../Settings/SettingsView';

export function MainContent(): React.ReactElement {
  const { activeTab } = useHub();

  return (
    <main id="srkl-main-stage" className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
      {activeTab === 'SERVICES' && <ServicesView />}
      {activeTab === 'SERVICE_BUILDER' && <ServiceBuilderView />}
      {activeTab === 'ACTIVITY' && <ActivityView />}
      {activeTab === 'SETTINGS' && <SettingsView />}
    </main>
  );
}
