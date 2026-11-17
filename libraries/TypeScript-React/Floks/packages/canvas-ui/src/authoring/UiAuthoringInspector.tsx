import React from 'react';
import type { UIAuthoringNode } from './types.js';

function readJsonObject<T>(raw: string): T | undefined {
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  } catch {
    return undefined;
  }
  return undefined;
}

function JsonEditor<T>(props: {
  label: string;
  value: T | undefined;
  nodeId: string;
  onCommit: (value: T) => void;
}) {
  const [invalid, setInvalid] = React.useState(false);
  return (
    <label className="mt-3 block text-xs">
      {props.label} (JSON)
      <textarea
        key={props.nodeId + props.label}
        className={`mt-1 min-h-20 w-full rounded border px-2 py-1.5 font-mono text-[10px] ${invalid ? 'border-red-500' : ''}`}
        defaultValue={JSON.stringify(props.value || {}, null, 2)}
        spellCheck={false}
        onBlur={(event) => {
          const parsed = readJsonObject<T>(event.currentTarget.value);
          setInvalid(!parsed);
          if (parsed) props.onCommit(parsed);
        }}
      />
      {invalid && <span className="text-[10px] text-red-600">Enter a valid JSON object, then blur to apply.</span>}
    </label>
  );
}

export function UiAuthoringInspector(props: {
  node?: UIAuthoringNode;
  onChange: (patch: Partial<UIAuthoringNode>) => void;
}) {
  if (!props.node) return <aside className="w-72 border-l border-black/10 p-3 text-xs opacity-60">Select a node.</aside>;
  const node = props.node;
  const description = String(node.props.description || '');
  return (
    <aside className="w-72 overflow-auto border-l border-black/10 p-3">
      <div className="mb-3 text-xs font-bold uppercase tracking-wide">{node.kind}</div>
      <label className="block text-xs">
        Name
        <input className="mt-1 w-full rounded border px-2 py-1.5" value={node.name} onChange={(e) => props.onChange({ name: e.target.value })} />
      </label>
      <label className="mt-3 block text-xs">
        Description
        <textarea className="mt-1 min-h-20 w-full rounded border px-2 py-1.5" value={description} onChange={(e) => props.onChange({ props: { ...node.props, description: e.target.value } })} />
      </label>
      <JsonEditor<Record<string, string | number | boolean>>
        label="Properties" value={node.props} nodeId={node.id}
        onCommit={(value) => props.onChange({ props: value })}
      />
      {node.kind === 'component' && <>
        <JsonEditor<Record<string, string[]>>
          label="Slots" value={node.slots} nodeId={node.id}
          onCommit={(slots) => props.onChange({ slots })}
        />
        <JsonEditor<Record<string, Record<string, string | number | boolean>>>
          label="Visual states" value={node.states} nodeId={node.id}
          onCommit={(states) => props.onChange({ states })}
        />
        <JsonEditor<Record<string, string>>
          label="Event → operation bindings" value={node.events} nodeId={node.id}
          onCommit={(events) => props.onChange({ events })}
        />
      </>}
    </aside>
  );
}
