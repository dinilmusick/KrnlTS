/**
 * @file ServiceBuilderStep2.tsx
 * @description Service Builder Step 2: Endpoints & Semantic Actions.
 * Conforms to Srkl-spec.md Section 14 (Steps 3 & 5).
 * File size < 200 lines strictly.
 */

import React from 'react';
import { ActionDefinition, EndpointDefinition } from '@/libraries/types/srkl';
import { EndpointsSection } from './EndpointsSection';
import { ActionsSection } from './ActionsSection';

interface Step2Props {
  endpoints: EndpointDefinition[];
  setEndpoints: React.Dispatch<React.SetStateAction<EndpointDefinition[]>>;
  actions: ActionDefinition[];
  setActions: React.Dispatch<React.SetStateAction<ActionDefinition[]>>;
}

export function ServiceBuilderStep2({
  endpoints,
  setEndpoints,
  actions,
  setActions,
}: Step2Props): React.ReactElement {
  return (
    <div className="space-y-4 font-mono text-xs">
      <EndpointsSection endpoints={endpoints} setEndpoints={setEndpoints} />
      <ActionsSection actions={actions} setActions={setActions} />
    </div>
  );
}
