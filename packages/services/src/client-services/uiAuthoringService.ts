import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import type {
  UIAuthoringBinding,
  UIAuthoringCreateInput,
  UIAuthoringNode,
  UIAuthoringOperation,
  UIAuthoringSession,
  UIAuthoringValidation,
} from '@kloks/contracts';
import { buildServiceUISchema, buildUIComponentArtifact, suggestUIComponent } from '@kloks/contracts';

let activeUIAuthoringService: IService<UIAuthoringState>;

interface UIAuthoringState extends Record<string, unknown> {
  sessions: Record<string, UIAuthoringSession>;
}

function buildUIAuthoringServiceDefinition(getService: () => IService<UIAuthoringState>): ServiceDefinition<UIAuthoringState> {
  return createServiceDefinition<UIAuthoringState>({
  id: 'kloks.service.uiAuthoring',
  name: 'UIAuthoringService',
  version: '1.0.0',
  state: { initial: { sessions: {} } },
  operations: {
    createSession: {
      id: 'UIAuthoringService.createSession',
      name: 'createSession',
      handler: async (input: UIAuthoringCreateInput, ctx) => {
        const sessionId = input.sessionId || `ui-authoring-${Date.now().toString(36)}`;
        const session: UIAuthoringSession = {
          sessionId,
          context: input.context,
          nodes: [],
          bindings: [],
          operations: input.operations || [],
          metadata: input.metadata || {},
        };
        getService().setState({ sessions: { ...getService().getState().sessions, [sessionId]: session } });
        return session;
      },
    },
    replaceSession: {
      id: 'UIAuthoringService.replaceSession',
      name: 'replaceSession',
      handler: async (input: { sessionId: string; session: UIAuthoringSession }, ctx) => {
        if (input.sessionId !== input.session.sessionId) throw new Error('Session id mismatch.');
        return updateSession(getService(), input.sessionId, () => input.session);
      },
    },
    addNode: {
      id: 'UIAuthoringService.addNode',
      name: 'addNode',
      handler: async (input: { sessionId: string; node: UIAuthoringNode }, ctx) => updateSession(getService(), input.sessionId, (session) => ({
        ...session, nodes: [...session.nodes.filter((node) => node.id !== input.node.id), input.node],
      })),
    },
    updateNode: {
      id: 'UIAuthoringService.updateNode',
      name: 'updateNode',
      handler: async (input: { sessionId: string; nodeId: string; patch: Partial<UIAuthoringNode> }, ctx) => updateSession(getService(), input.sessionId, (session) => ({
        ...session, nodes: session.nodes.map((node) => node.id === input.nodeId ? { ...node, ...input.patch } : node),
      })),
    },
    removeNode: {
      id: 'UIAuthoringService.removeNode',
      name: 'removeNode',
      handler: async (input: { sessionId: string; nodeId: string }, ctx) => updateSession(getService(), input.sessionId, (session) => {
        const removedIds = new Set<string>([input.nodeId]);
        let expanded = true;
        while (expanded) {
          expanded = false;
          for (const node of session.nodes) {
            if (node.parentId && removedIds.has(node.parentId) && !removedIds.has(node.id)) {
              removedIds.add(node.id);
              expanded = true;
            }
          }
        }
        return {
          ...session,
          nodes: session.nodes
            .filter((node) => !removedIds.has(node.id))
            .map((node) => ({
              ...node,
              slots: node.slots
                ? Object.fromEntries(Object.entries(node.slots).map(([slot, children]) => [
                    slot, children.filter((childId) => !removedIds.has(childId)),
                  ]))
                : undefined,
            })),
          bindings: session.bindings.filter((binding) => !removedIds.has(binding.componentId)),
        };
      }),
    },
    setBinding: {
      id: 'UIAuthoringService.setBinding',
      name: 'setBinding',
      handler: async (input: { sessionId: string; binding: UIAuthoringBinding }, ctx) => updateSession(getService(), input.sessionId, (session) => ({
        ...session,
        bindings: [...session.bindings.filter((binding) => binding.componentId !== input.binding.componentId || binding.property !== input.binding.property), input.binding],
      })),
    },
    setOperations: {
      id: 'UIAuthoringService.setOperations',
      name: 'setOperations',
      handler: async (input: { sessionId: string; operations: UIAuthoringOperation[] }, ctx) => updateSession(getService(), input.sessionId, (session) => ({ ...session, operations: input.operations })),
    },
    validate: {
      id: 'UIAuthoringService.validate',
      name: 'validate',
      handler: async (input: { sessionId: string }, ctx) => validateSession(getSession(getService(), input.sessionId)),
    },
    serialize: {
      id: 'UIAuthoringService.serialize',
      name: 'serialize',
      handler: async (input: { sessionId: string }, ctx) => JSON.stringify(getSession(getService(), input.sessionId), null, 2),
    },
    generateArtifact: {
      id: 'UIAuthoringService.generateArtifact',
      name: 'generateArtifact',
      handler: async (input: { sessionId: string }, ctx) => buildUIComponentArtifact(getSession(getService(), input.sessionId)),
    },
    generateServiceUI: {
      id: 'UIAuthoringService.generateServiceUI',
      name: 'generateServiceUI',
      handler: async (input: { sessionId: string }, ctx) => {
        const session = getSession(getService(), input.sessionId);
        const validation = validateSession(session);
        if (!validation.valid) {
          throw new Error(`Cannot generate ServiceUISchema: ${validation.errors.join('; ')}`);
        }
        return buildServiceUISchema(session);
      },
    },
    suggestComponent: {
      id: 'UIAuthoringService.suggestComponent',
      name: 'suggestComponent',
      handler: async (input: { fieldType: string }) => suggestUIComponent(input.fieldType),
    },
    getSession: {
      id: 'UIAuthoringService.getSession',
      name: 'getSession',
      handler: async (input: { sessionId: string }, ctx) => getService().getState().sessions[input.sessionId] || null,
    },
  },
  });
}

export const UIAuthoringServiceDefinition = buildUIAuthoringServiceDefinition(() => activeUIAuthoringService);
function getSession(service: IService<UIAuthoringState>, sessionId: string): UIAuthoringSession {
  const session = service.getState().sessions[sessionId];
  if (!session) throw new Error(`Unknown UI authoring session: ${sessionId}`);
  return session;
}

function updateSession(
  service: IService<UIAuthoringState>,
  sessionId: string,
  update: (session: UIAuthoringSession) => UIAuthoringSession
): UIAuthoringSession {
  const session = update(getSession(service, sessionId));
  service.setState({ sessions: { ...service.getState().sessions, [sessionId]: session } });
  return session;
}

function validateSession(session: UIAuthoringSession): UIAuthoringValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!session.nodes.some((node) => node.kind === 'page')) errors.push('At least one page is required.');
  const ids = new Set<string>();
  for (const node of session.nodes) {
    if (ids.has(node.id)) errors.push(`Duplicate authoring node id: ${node.id}`);
    ids.add(node.id);
    if (node.parentId && !session.nodes.some((parent) => parent.id === node.parentId)) errors.push(`Missing parent for node: ${node.id}`);
    if (node.kind === 'page' && node.parentId) errors.push(`Page cannot have a parent: ${node.id}`);
    if (node.kind === 'section' && !node.parentId) errors.push(`Section requires a page parent: ${node.id}`);
    if (node.kind === 'section' && node.parentId && !session.nodes.some((parent) => parent.id === node.parentId && parent.kind === 'page')) errors.push(`Section parent must be a page: ${node.id}`);
    if (node.kind === 'component' && !node.parentId) errors.push(`Component requires a section parent: ${node.id}`);
    if (node.kind === 'component' && node.parentId && !session.nodes.some((parent) => parent.id === node.parentId && (parent.kind === 'section' || parent.kind === 'component'))) errors.push(`Component parent must be a section or component: ${node.id}`);
  }
  if (session.nodes.some((node) => node.kind === 'component' && !node.assetRef)) errors.push('Every component node requires a FLOKS asset reference.');
  if (session.context === 'service' && !session.metadata.serviceId) errors.push('Service authoring requires metadata.serviceId.');
  for (const node of session.nodes) {
    for (const [slotId, childIds] of Object.entries(node.slots || {})) {
      if (!slotId.trim()) errors.push(`Slot id cannot be blank on node: ${node.id}`);
      for (const childId of childIds) {
        const child = session.nodes.find((candidate) => candidate.id === childId);
        if (!child) errors.push(`Slot ${slotId} references missing child: ${childId}`);
        else if (child.parentId !== node.id) errors.push(`Slot child ${childId} must be a direct child of node: ${node.id}`);
      }
    }
    for (const [eventName, operationId] of Object.entries(node.events || {})) {
      if (!eventName.trim()) errors.push(`Event name cannot be blank on node: ${node.id}`);
      if (!operationId.trim() || !session.operations.some((operation) => operation.operationId === operationId)) {
        errors.push(`Event ${eventName} references missing operation: ${operationId}`);
      }
    }
  }
  for (const binding of session.bindings) {
    const component = session.nodes.find((node) => node.id === binding.componentId);
    if (!component) errors.push(`Binding references missing component: ${binding.componentId}`);
    else if (component.kind !== 'component') errors.push(`Binding target must be a component node: ${binding.componentId}`);
    const operation = session.operations.find((item) => item.operationId === binding.target.apiId);
    if (!operation) {
      errors.push(`Binding references missing operation: ${binding.target.apiId}`);
      continue;
    }
    const fields = binding.target.kind === 'api-input' ? operation.inputFields : operation.outputFields;
    const field = fields?.find((item) => item.name === binding.target.field);
    if (!field) errors.push(`Binding references missing ${binding.target.kind === 'api-input' ? 'input' : 'output'} field: ${binding.target.apiId}.${binding.target.field}`);
    else if (field.type.toLowerCase() !== binding.target.fieldType.toLowerCase()) {
      errors.push(`Binding field type mismatch for ${binding.target.apiId}.${binding.target.field}: expected ${field.type}, received ${binding.target.fieldType}`);
    }
  }
  if (!session.operations.length) warnings.push('No service operations have been attached to this authoring session.');
  return { valid: errors.length === 0, errors, warnings };
}

export function createUIAuthoringService(): IService<UIAuthoringState> {
  let instance!: IService<UIAuthoringState>;
  instance = createService(buildUIAuthoringServiceDefinition(() => instance));
  return instance;
}

const defaultUIAuthoringService = createService(UIAuthoringServiceDefinition);
activeUIAuthoringService = defaultUIAuthoringService;
export const UIAuthoringServiceFacade = {
  id: UIAuthoringServiceDefinition.id,
  name: UIAuthoringServiceDefinition.name,
  version: UIAuthoringServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: UIAuthoringServiceDefinition,
  service: defaultUIAuthoringService,
  createInstance: createUIAuthoringService,
  execute: async <TIn = unknown, TOut = unknown>(operation: string, input?: TIn) => {
    await defaultUIAuthoringService.start();
    return defaultUIAuthoringService.call<TIn, TOut>(operation, input);
  },
};
