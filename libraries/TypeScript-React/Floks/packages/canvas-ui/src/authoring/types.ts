export type UIAuthoringContext = 'service' | 'general-component' | 'application';
export type UIAuthoringNodeKind = 'page' | 'section' | 'component';

export interface AuthoringAssetRef {
  packageId: string;
  packageVersion: string;
  exportPath: string;
  assetId: string;
  assetVersion: string;
}

export interface UIAuthoringNode {
  id: string;
  kind: UIAuthoringNodeKind;
  name: string;
  componentId?: string;
  assetRef?: AuthoringAssetRef;
  parentId?: string;
  props: Record<string, string | number | boolean>;
  slots?: Record<string, string[]>;
  states?: Record<string, Record<string, string | number | boolean>>;
  events?: Record<string, string>;
}

export interface UIAuthoringSession {
  sessionId: string;
  context: UIAuthoringContext;
  nodes: UIAuthoringNode[];
  bindings: Array<{
    componentId: string;
    property: string;
    target: { kind: string; apiId: string; field: string; fieldType?: string };
  }>;
  operations: Array<{ operationId: string; name: string; description?: string; inputFields?: Array<{ name: string; type: string }>; outputFields?: Array<{ name: string; type: string }> }>;
  metadata: Record<string, string>;
}
