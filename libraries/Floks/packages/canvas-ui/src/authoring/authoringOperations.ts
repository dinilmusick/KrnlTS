import type { AuthoringAssetRef, UIAuthoringContext, UIAuthoringNode, UIAuthoringSession } from './types.js';
import { getAuthoringSubtreeIds } from './authoringModel.js';

export interface CreateAuthoringSessionInput {
  sessionId: string;
  context: UIAuthoringContext;
  operations?: UIAuthoringSession['operations'];
  metadata?: Record<string, string>;
}

export interface AddAuthoringNodeInput {
  id: string;
  kind: UIAuthoringNode['kind'];
  name?: string;
  componentId?: string;
  assetRef?: AuthoringAssetRef;
  parentId?: string;
  props?: UIAuthoringNode['props'];
  slots?: UIAuthoringNode['slots'];
  states?: UIAuthoringNode['states'];
  events?: UIAuthoringNode['events'];
}

export interface AuthoringBindingInput {
  componentId: string;
  property: string;
  target: {
    kind: string;
    apiId: string;
    field: string;
    fieldType?: string;
  };
}

/**
 * Pure, render-free API for constructing and mutating a Floks UI authoring session.
 * Consumers can use this API from agents, generators, tests, or other UI tooling
 * without mounting React components.
 */
export function createAuthoringSession(input: CreateAuthoringSessionInput): UIAuthoringSession {
  return {
    sessionId: input.sessionId,
    context: input.context,
    nodes: [],
    bindings: [],
    operations: [...(input.operations ?? [])],
    metadata: { ...(input.metadata ?? {}) },
  };
}

export function addAuthoringNode(
  session: UIAuthoringSession,
  input: AddAuthoringNodeInput,
): UIAuthoringSession {
  if (session.nodes.some((node) => node.id === input.id)) {
    throw new Error(`Authoring node '${input.id}' already exists.`);
  }
  if (input.parentId && !session.nodes.some((node) => node.id === input.parentId)) {
    throw new Error(`Authoring parent '${input.parentId}' does not exist.`);
  }

  const node: UIAuthoringNode = {
    id: input.id,
    kind: input.kind,
    name: input.name ?? (input.kind === 'component' ? input.componentId ?? 'Component' : input.kind[0].toUpperCase() + input.kind.slice(1)),
    componentId: input.componentId,
    assetRef: input.assetRef,
    parentId: input.parentId,
    props: { ...(input.props ?? {}) },
    slots: input.slots ? { ...input.slots } : undefined,
    states: input.states ? { ...input.states } : undefined,
    events: input.events ? { ...input.events } : undefined,
  };

  return { ...session, nodes: [...session.nodes, node] };
}

export function updateAuthoringNode(
  session: UIAuthoringSession,
  nodeId: string,
  patch: Partial<Omit<UIAuthoringNode, 'id'>>,
): UIAuthoringSession {
  if (!session.nodes.some((node) => node.id === nodeId)) {
    throw new Error(`Authoring node '${nodeId}' does not exist.`);
  }
  if (patch.parentId && !session.nodes.some((node) => node.id === patch.parentId)) {
    throw new Error(`Authoring parent '${patch.parentId}' does not exist.`);
  }

  return {
    ...session,
    nodes: session.nodes.map((node) => node.id === nodeId ? { ...node, ...patch } : node),
  };
}

export function removeAuthoringNode(
  session: UIAuthoringSession,
  nodeId: string,
): UIAuthoringSession {
  if (!session.nodes.some((node) => node.id === nodeId)) {
    throw new Error(`Authoring node '${nodeId}' does not exist.`);
  }

  const removedIds = getAuthoringSubtreeIds(nodeId, session.nodes);
  return {
    ...session,
    nodes: session.nodes
      .filter((node) => !removedIds.has(node.id))
      .map((node) => ({
        ...node,
        slots: node.slots
          ? Object.fromEntries(Object.entries(node.slots).map(([slot, children]) => [
              slot,
              children.filter((childId) => !removedIds.has(childId)),
            ]))
          : undefined,
      })),
    bindings: session.bindings.filter((binding) => !removedIds.has(binding.componentId)),
  };
}

export function bindAuthoringProperty(
  session: UIAuthoringSession,
  input: AuthoringBindingInput,
): UIAuthoringSession {
  if (!session.nodes.some((node) => node.id === input.componentId)) {
    throw new Error(`Authoring component '${input.componentId}' does not exist.`);
  }
  if (!input.property.trim()) {
    throw new Error('Authoring binding property cannot be empty.');
  }

  const property = input.property.trim();
  return {
    ...session,
    bindings: [
      ...session.bindings.filter(
        (binding) => binding.componentId !== input.componentId || binding.property !== property,
      ),
      { ...input, property },
    ],
  };
}

export function removeAuthoringBinding(
  session: UIAuthoringSession,
  componentId: string,
  property: string,
): UIAuthoringSession {
  return {
    ...session,
    bindings: session.bindings.filter(
      (binding) => binding.componentId !== componentId || binding.property !== property,
    ),
  };
}

export function setAuthoringOperations(
  session: UIAuthoringSession,
  operations: UIAuthoringSession['operations'],
): UIAuthoringSession {
  return { ...session, operations: operations.map((operation) => ({ ...operation })) };
}
