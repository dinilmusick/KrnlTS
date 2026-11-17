import React from 'react';
import type { AuthoringAssetRef, UIAuthoringContext, UIAuthoringNode, UIAuthoringSession } from './types.js';
import { UiAuthoringInspector } from './UiAuthoringInspector.js';
import { UiAuthoringTree } from './UiAuthoringTree.js';
import { UiAuthoringBindingEditor } from './UiAuthoringBindingEditor.js';
import {
  addAuthoringNode,
  removeAuthoringNode,
  updateAuthoringNode,
} from './authoringOperations.js';

export function UiAuthoringWorkspace(props: {
  session: UIAuthoringSession;
  availableAssets: AuthoringAssetRef[];
  onChange: (session: UIAuthoringSession) => void;
  onValidate?: () => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string>();
  const selectedNode = props.session.nodes.find((node) => node.id === selectedNodeId);

  const addNode = (kind: UIAuthoringNode['kind'], assetRef?: AuthoringAssetRef) => {
    const parent = kind === 'section'
      ? props.session.nodes.find((node) => node.kind === 'page')
      : kind === 'component'
        ? props.session.nodes.find((node) => node.kind === 'section')
        : undefined;
    const id = `authoring-${kind}-${Date.now().toString(36)}`;
    const session = addAuthoringNode(props.session, {
      id,
      kind,
      name: kind === 'component' ? assetRef?.assetId || 'Component' : kind[0].toUpperCase() + kind.slice(1),
      componentId: kind === 'component' ? assetRef?.assetId : undefined,
      assetRef,
      parentId: parent?.id,
    });
    props.onChange(session);
    setSelectedNodeId(id);
  };

  const updateSelected = (patch: Partial<UIAuthoringNode>) => {
    if (!selectedNode) return;
    props.onChange(updateAuthoringNode(props.session, selectedNode.id, patch));
  };

  const removeSelected = () => {
    if (!selectedNode) return;
    props.onChange(removeAuthoringNode(props.session, selectedNode.id));
    setSelectedNodeId(undefined);
  };

  const contextLabel: Record<UIAuthoringContext, string> = {
    service: 'Service UI',
    'general-component': 'General Component',
    application: 'Application UI',
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden border border-black/10 bg-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-black/10 px-3 py-2">
        <strong className="text-xs">{contextLabel[props.session.context]} Authoring</strong>
        <button type="button" onClick={() => addNode('page')} className="rounded border px-2 py-1 text-xs">Page</button>
        <button type="button" onClick={() => addNode('section')} className="rounded border px-2 py-1 text-xs">Section</button>
        <select
          className="rounded border px-2 py-1 text-xs"
          value=""
          onChange={(e) => {
            const asset = props.availableAssets.find((item) => item.assetId === e.target.value);
            if (asset) addNode('component', asset);
          }}
        >
          <option value="">Add component…</option>
          {props.availableAssets.map((asset) => <option key={asset.assetId} value={asset.assetId}>{asset.assetId}</option>)}
        </select>
        <button type="button" disabled={!selectedNode} onClick={removeSelected} className="ml-auto rounded border px-2 py-1 text-xs disabled:opacity-40">Remove</button>
        <button type="button" onClick={props.onValidate} className="rounded border px-2 py-1 text-xs">Validate</button>
      </header>
      <div className="flex min-h-0 flex-1">
        <UiAuthoringTree nodes={props.session.nodes} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
        <UiAuthoringInspector node={selectedNode} onChange={updateSelected} />
      </div>
      <UiAuthoringBindingEditor session={props.session} onChange={props.onChange} />
    </section>
  );
}
