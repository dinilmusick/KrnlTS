import React from 'react';
import type { UIAuthoringNode, UIAuthoringSession } from './types.js';

export type UiAuthoringComponentRenderer = (
  node: UIAuthoringNode,
  slots: Record<string, React.ReactNode[]>,
) => React.ReactNode;

export function UiAuthoringPreview(props: {
  session: UIAuthoringSession;
  renderComponent: UiAuthoringComponentRenderer;
  emptyMessage?: string;
}) {
  const nodesById = new Map(props.session.nodes.map((node) => [node.id, node]));
  const structuralChildren = (parentId: string) => props.session.nodes.filter(
    (node) => node.parentId === parentId && node.kind !== 'component' || (
      node.parentId === parentId && nodesById.get(parentId)?.kind === 'section'
    ),
  );

  const renderNode = (node: UIAuthoringNode): React.ReactNode => {
    if (node.kind === 'page') {
      return <main key={node.id} data-authoring-page={node.id}>{structuralChildren(node.id).map(renderNode)}</main>;
    }
    if (node.kind === 'section') {
      return <section key={node.id} data-authoring-section={node.id}>{structuralChildren(node.id).map(renderNode)}</section>;
    }
    const slotIds = node.slots || {};
    const slots = Object.fromEntries(Object.entries(slotIds).map(([slot, childIds]) => [
      slot, childIds.map((id) => nodesById.get(id)).filter((child): child is UIAuthoringNode => Boolean(child)).map(renderNode),
    ]));
    return <React.Fragment key={node.id}>{props.renderComponent(node, slots)}</React.Fragment>;
  };

  const roots = props.session.nodes.filter((node) =>
    !node.parentId || !nodesById.has(node.parentId),
  );
  if (!roots.length) return <div className="p-4 text-xs opacity-60">{props.emptyMessage || 'Add a page or component to preview.'}</div>;
  return <div className="min-h-0 w-full">{roots.map(renderNode)}</div>;
}
