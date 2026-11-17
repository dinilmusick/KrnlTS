import type { AssetRef } from './serviceUiSchema.js';
import type { UIAuthoringContext, UIAuthoringSession } from './uiAuthoringSchema.js';

export type UIComponentPurpose = 'service-ui' | 'general-purpose' | 'application-specific';
export type UIComponentPromotion = 'always' | 'usually' | 'never';

export interface UIComponentArtifact {
  artifactId: string;
  schemaVersion: string;
  purpose: UIComponentPurpose;
  promotion: UIComponentPromotion;
  origin: 'kult' | 'theta' | 'kelt' | 'other';
  context: UIAuthoringContext;
  name: string;
  description: string;
  rootAsset?: AssetRef;
  session: UIAuthoringSession;
}

export function getUIComponentPurpose(context: UIAuthoringContext): UIComponentPurpose {
  if (context === 'service') return 'service-ui';
  if (context === 'general-component') return 'general-purpose';
  return 'application-specific';
}

export function getUIComponentPromotion(purpose: UIComponentPurpose): UIComponentPromotion {
  if (purpose === 'service-ui' || purpose === 'general-purpose') return 'always';
  return 'usually';
}

export function buildUIComponentArtifact(session: UIAuthoringSession): UIComponentArtifact {
  const purpose = getUIComponentPurpose(session.context);
  const origin = (session.metadata.origin === 'kult' || session.metadata.origin === 'theta' || session.metadata.origin === 'kelt')
    ? session.metadata.origin : 'other';
  const requestedRootId = session.metadata.rootComponentId;
  const root = session.nodes.find((node) => node.kind === 'component' && node.id === requestedRootId)
    || session.nodes.find((node) => node.kind === 'component');
  const rootAsset = root?.assetRef;
  return {
    artifactId: 'kloks.ui-artifact.' + session.sessionId,
    schemaVersion: '1.0.0',
    purpose,
    promotion: getUIComponentPromotion(purpose),
    origin,
    context: session.context,
    name: session.metadata.name || session.sessionId,
    description: session.metadata.description || '',
    rootAsset,
    session,
  };
}
