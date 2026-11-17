import type { AssetRef, ServiceUISchema } from './serviceUiSchema.js';

export type UIAuthoringContext = 'service' | 'general-component' | 'application';
export type UIAuthoringNodeKind = 'page' | 'section' | 'component';

export interface UIAuthoringNode {
  id: string;
  kind: UIAuthoringNodeKind;
  name: string;
  componentId?: string;
  assetRef?: AssetRef;
  parentId?: string;
  props: Record<string, string | number | boolean>;
  slots?: Record<string, string[]>;
  states?: Record<string, Record<string, string | number | boolean>>;
  events?: Record<string, string>;
}

export interface UIAuthoringBinding {
  componentId: string;
  property: string;
  target:
    | { kind: 'api-input'; apiId: string; field: string; fieldType: string }
    | { kind: 'api-output'; apiId: string; field: string; fieldType: string };
}

export interface UIAuthoringOperation {
  operationId: string;
  name: string;
  description?: string;
  inputFields?: Array<{ name: string; type: string }>;
  outputFields?: Array<{ name: string; type: string }>;
}

export interface UIAuthoringSession {
  sessionId: string;
  context: UIAuthoringContext;
  nodes: UIAuthoringNode[];
  bindings: UIAuthoringBinding[];
  operations: UIAuthoringOperation[];
  metadata: Record<string, string>;
}

export interface UIAuthoringCreateInput {
  sessionId?: string;
  context: UIAuthoringContext;
  operations?: UIAuthoringOperation[];
  metadata?: Record<string, string>;
}

export interface UIAuthoringValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const UI_AUTHORING_SCHEMA_VERSION = '1.1.0';

export function suggestUIComponent(fieldType: string): string {
  const normalized = fieldType.toLowerCase();
  if (normalized === 'email') return 'TextInput.email';
  if (normalized === 'password') return 'TextInput.password';
  if (normalized === 'boolean' || normalized === 'bool') return 'ToggleInput';
  if (normalized === 'number' || normalized === 'integer' || normalized === 'float') return 'NumberInput';
  if (normalized.includes('date')) return 'DateInput';
  return 'TextInput';
}

export function buildServiceUISchema(session: UIAuthoringSession): ServiceUISchema {
  if (session.context !== 'service') throw new Error('Service UI schema generation requires service context.');
  const pages = session.nodes.filter((node) => node.kind === 'page');
  const sections = session.nodes.filter((node) => node.kind === 'section');
  const components = session.nodes.filter((node) => node.kind === 'component');
  const assetRefs = [
    ...sections.map((node) => node.assetRef),
    ...components.map((node) => node.assetRef),
  ].filter(Boolean) as AssetRef[];
  const componentDescriptor = (component: (typeof components)[number]) => {
    if (!component.assetRef) throw new Error(`Component '${component.id}' requires a FLOKS asset reference before ServiceUISchema generation.`);
    return {
      name: component.name,
      assetRef: component.assetRef,
      description: component.props.description as string | undefined,
    };
  };
  const sectionDescriptor = (section: (typeof sections)[number]) => ({
    name: section.name,
    ...(section.assetRef ? { assetRef: section.assetRef } : {}),
    components: components.filter((component) => component.parentId === section.id).map(componentDescriptor),
    description: section.props.description as string | undefined,
  });
  return {
    schemaId: `kloks.authored-ui.${session.sessionId}`,
    schemaVersion: UI_AUTHORING_SCHEMA_VERSION,
    serviceId: session.metadata.serviceId || 'unknown-service',
    requirementMode: 'optional',
    pages: pages.map((page) => ({
      name: page.name,
      sections: sections.filter((section) => section.parentId === page.id).map(sectionDescriptor),
      description: page.props.description as string | undefined,
    })),
    sections: sections.map(sectionDescriptor),
    components: components.map(componentDescriptor),
    assetRefs,
    operationBindings: session.bindings.map((binding) => ({
      operationId: binding.target.apiId,
      uiPath: binding.componentId,
    })),
  };
}
