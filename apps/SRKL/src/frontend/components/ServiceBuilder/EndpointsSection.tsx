/**
 * @file EndpointsSection.tsx
 * @description Endpoint configuration sub-section for Service Builder Step 2.
 * Adheres to Skipo BaseIconButton icon-only button protocol.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { BaseInput } from '@skipo/ui';
import { BrutalistSelect } from '../common/BrutalistSelect';
import { Plus, Trash2, Route } from 'lucide-react';
import { EndpointDefinition } from '@/libraries/types/srkl';
import { BaseIconButton } from '../common/BaseIconButton';

interface EndpointsSectionProps {
  endpoints: EndpointDefinition[];
  setEndpoints: React.Dispatch<React.SetStateAction<EndpointDefinition[]>>;
}

export function EndpointsSection({ endpoints, setEndpoints }: EndpointsSectionProps): React.ReactElement {
  const addEndpoint = () => {
    setEndpoints((prev) => [
      ...prev,
      {
        name: `Endpoint ${prev.length + 1}`,
        path: `/v1/resource_${prev.length + 1}`,
        method: 'GET',
        authentication: true,
        description: 'New service route endpoint',
      },
    ]);
  };

  const removeEndpoint = (idx: number) => {
    setEndpoints((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-3 border border-neutral-800 bg-neutral-950/60 rounded-none space-y-3 font-mono text-xs shadow-[2px_2px_0px_#000]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase text-neutral-200">3. Endpoints</h3>
        </div>
        <BaseIconButton
          tooltip="Add Service Route Endpoint"
          icon={<Plus className="w-3.5 h-3.5" />}
          variant="primary"
          size="sm"
          onClick={addEndpoint}
        />
      </div>

      <div className="space-y-2">
        {endpoints.map((ep, i) => (
          <div key={i} className="p-2.5 border border-neutral-800 bg-neutral-900 rounded-none space-y-2">
            <div className="flex items-center gap-2">
              <BrutalistSelect value={ep.method}
                onChange={(e) => {
                  const m = e.target.value as EndpointDefinition['method'];
                  setEndpoints((prev) => prev.map((item, idx) => (idx === i ? { ...item, method: m } : item)));
                }} inspectionLabel="HTTP Method">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </BrutalistSelect>

              <BaseInput type="text" placeholder="/path"
                value={ep.path}
                onChange={(e) => {
                  const p = e.target.value;
                  setEndpoints((prev) => prev.map((item, idx) => (idx === i ? { ...item, path: p } : item)));
                }}
                className="flex-1" />

              <BaseIconButton
                tooltip="Delete Route Endpoint"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                variant="danger"
                size="sm"
                onClick={() => removeEndpoint(i)}
              />
            </div>

            <BaseInput type="text" placeholder="Endpoint description"
              value={ep.description}
              onChange={(e) => {
                const d = e.target.value;
                setEndpoints((prev) => prev.map((item, idx) => (idx === i ? { ...item, description: d } : item)));
              }}
              className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
