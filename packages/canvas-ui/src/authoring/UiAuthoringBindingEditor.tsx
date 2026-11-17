import React from 'react';
import type { UIAuthoringSession } from './types.js';

export function UiAuthoringBindingEditor(props: {
  session: UIAuthoringSession;
  onChange: (session: UIAuthoringSession) => void;
}) {
  const components = props.session.nodes.filter((node) => node.kind === 'component');
  const [componentId, setComponentId] = React.useState('');
  const [property, setProperty] = React.useState('value');
  const [operationId, setOperationId] = React.useState('');
  const [targetKind, setTargetKind] = React.useState<'api-input' | 'api-output'>('api-input');
  const [fieldName, setFieldName] = React.useState('');
  const operation = props.session.operations.find((item) => item.operationId === operationId);
  const fields = targetKind === 'api-input' ? operation?.inputFields || [] : operation?.outputFields || [];

  const addBinding = () => {
    if (!componentId || !property.trim() || !operationId || !fields.length) return;
    const field = fields.find((item) => item.name === fieldName) || fields[0];
    const binding = { componentId, property: property.trim(), target: {
      kind: targetKind, apiId: operationId, field: field.name, fieldType: field.type,
    }};
    props.onChange({
      ...props.session,
      bindings: [...props.session.bindings.filter((item) => item.componentId !== componentId || item.property !== property.trim()), binding],
    });
  };

  const removeBinding = (component: string, prop: string) => props.onChange({
    ...props.session,
    bindings: props.session.bindings.filter((item) => item.componentId !== component || item.property !== prop),
  });

  return (
    <section className="shrink-0 border-t border-black/10 p-3 text-xs">
      <div className="mb-2 font-bold uppercase tracking-wide">Data bindings</div>
      <div className="flex flex-wrap items-center gap-2">
        <select className="max-w-48 rounded border px-2 py-1.5" value={componentId} onChange={(event) => setComponentId(event.target.value)}>
          <option value="">Component…</option>
          {components.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
        </select>
        <input className="w-28 rounded border px-2 py-1.5" aria-label="Bound property" value={property} onChange={(event) => setProperty(event.target.value)} />
        <select className="rounded border px-2 py-1.5" value={operationId} onChange={(event) => setOperationId(event.target.value)}>
          <option value="">Operation…</option>
          {props.session.operations.map((item) => <option key={item.operationId} value={item.operationId}>{item.name}</option>)}
        </select>
        <select className="rounded border px-2 py-1.5" value={targetKind} onChange={(event) => setTargetKind(event.target.value as 'api-input' | 'api-output')}>
          <option value="api-input">Operation input</option>
          <option value="api-output">Operation output</option>
        </select>
        <select className="max-w-40 rounded border px-2 py-1.5" aria-label="Bound field" value={fields.some((field) => field.name === fieldName) ? fieldName : fields[0]?.name || ''} disabled={!fields.length} onChange={(event) => setFieldName(event.target.value)}>
          {fields.length ? fields.map((field) => <option key={field.name} value={field.name}>{field.name} · {field.type}</option>) : <option value="">No fields</option>}
        </select>
        <button type="button" className="rounded border px-2 py-1.5 disabled:opacity-40" disabled={!componentId || !operationId || !fields.length} onClick={addBinding}>Add / replace</button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {props.session.bindings.map((binding) => (
          <li key={binding.componentId + ':' + binding.property} className="flex items-center gap-2 rounded bg-black/5 px-2 py-1">
            <span>{components.find((node) => node.id === binding.componentId)?.name || binding.componentId}.{binding.property} ← {binding.target.apiId}.{binding.target.field}</span>
            <button type="button" aria-label={`Remove binding ${binding.property}`} onClick={() => removeBinding(binding.componentId, binding.property)}>×</button>
          </li>
        ))}
        {!props.session.bindings.length && <li className="opacity-60">No bindings configured.</li>}
      </ul>
    </section>
  );
}
