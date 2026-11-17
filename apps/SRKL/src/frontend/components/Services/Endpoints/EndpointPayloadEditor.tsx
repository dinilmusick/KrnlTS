/**
 * @file EndpointPayloadEditor.tsx
 * @description In-tile payload and parameter editor for endpoints.
 * Allows setting path parameters, query parameters, headers, and request body.
 * File size < 200 lines strictly.
 */

import React, { useMemo } from 'react';
import { AlignLeft, Braces } from 'lucide-react';
import { BaseInput, BaseTextarea } from '@skipo/ui';
import { EndpointDefinition } from '@/libraries/types/srkl';
import { EndpointExecutionParams } from '@/libraries/utils/endpointExecutor';
import { BaseIconButton } from '../../common/BaseIconButton';

interface EndpointPayloadEditorProps {
  endpoint: EndpointDefinition;
  params: EndpointExecutionParams;
  onChange: (updated: EndpointExecutionParams) => void;
}

export function EndpointPayloadEditor({
  endpoint,
  params,
  onChange,
}: EndpointPayloadEditorProps): React.ReactElement {
  // Extract placeholders like {model}, {id}, {owner}
  const pathVars = useMemo(() => {
    const matches = endpoint.path.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return matches.map((m) => m.replace(/[{}]/g, ''));
  }, [endpoint.path]);

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(params.body);
      onChange({ ...params, body: JSON.stringify(parsed, null, 2) });
    } catch {
      // ignore if invalid JSON
    }
  };

  return (
    <div className="space-y-2.5 font-mono text-xs">
      {/* Path Variables if any */}
      {pathVars.length > 0 && (
        <div className="space-y-1.5 p-2 bg-neutral-950/80 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase">
            <Braces className="w-3 h-3" />
            <span>Path Parameters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pathVars.map((v) => (
              <div key={v} className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-400 px-1 py-0.5 bg-neutral-900 border border-neutral-800 shrink-0">
                  {`{${v}}`}
                </span>
                <BaseInput
                  type="text"
                  placeholder={`Value for ${v}`}
                  value={params.pathParams[v] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange({
                      ...params,
                      pathParams: { ...params.pathParams, [v]: val },
                    });
                  }}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Parameters for GET/DELETE or generic */}
      {!hasBody && (
        <div className="space-y-1 p-2 bg-neutral-950/60 border border-neutral-850">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Query Params (Optional)</span>
          </div>
          <BaseInput
            type="text"
            placeholder="e.g. limit=10&sort=desc"
            value={params.queryParams['raw'] || ''}
            onChange={(e) => {
              const val = e.target.value;
              const parsed: Record<string, string> = { raw: val };
              if (val.includes('=')) {
                val.split('&').forEach((pair) => {
                  const [k, v] = pair.split('=');
                  if (k) parsed[k.trim()] = (v || '').trim();
                });
              }
              onChange({ ...params, queryParams: parsed });
            }}
            className="w-full"
          />
        </div>
      )}

      {/* JSON Payload Editor for POST / PUT / PATCH */}
      {hasBody && (
        <div className="space-y-1 p-2 bg-neutral-950/80 border border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase">
              <AlignLeft className="w-3 h-3" />
              <span>Request JSON Payload</span>
            </div>
            <BaseIconButton
              tooltip="Format JSON"
              icon={<Braces className="w-3 h-3 text-amber-400" />}
              variant="subtle"
              size="sm"
              onClick={handleFormatJson}
            />
          </div>
          <BaseTextarea
            rows={3}
            value={params.body}
            onChange={(e) => onChange({ ...params, body: e.target.value })}
            placeholder='{\n  "prompt": "Hello",\n  "temperature": 0.7\n}'
            className="w-full font-mono text-[11px] resize-y"
          />
        </div>
      )}
    </div>
  );
}
