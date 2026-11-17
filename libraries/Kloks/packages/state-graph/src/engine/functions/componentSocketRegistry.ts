import { SpaceNode, ContainerNode, ComponentSocketConstraint } from "../types/index.js";

/**
 * Formal Registry for Component Socket Constraints across the audio node graph.
 * Enforces strict type boundaries (e.g. Audio Sampler STORE IN socket ONLY accepts Audio Containers).
 */
export function getComponentSocketConstraint(
  targetNode: SpaceNode,
  targetPort?: string
): ComponentSocketConstraint | null {
  // 2. Combiner / Multiplexer Node in Component Signal Mode
  if (targetNode.type === 'combiner' || targetNode.type === 'multiplexer') {
    const sigType = (targetNode as any).signalType;
    if (sigType === 'component') {
      return {
        allowedNodeTypes: ['container'],
        allowedContainerTypes: ['audio'],
        description: 'Component Combiner/Multiplexer ONLY accepts Audio Container nodes',
      };
    }
  }

  // 3. Module Nodes accepting Component Signal inputs
  if (targetNode.type === 'module') {
    if (targetPort && targetPort.includes('comp')) {
      return {
        allowedNodeTypes: ['container'],
        allowedContainerTypes: ['audio'],
        description: 'Component input socket accepts Audio Container components',
      };
    }
  }

  return null;
}

/**
 * Validates whether a source node satisfies a target socket constraint.
 */
export function validateComponentSocketConnection(
  fromNode: SpaceNode,
  constraint: ComponentSocketConstraint
): { isValid: boolean; reason?: string } {
  // Validate high-level Node Type (container, module, etc.)
  if (!constraint.allowedNodeTypes.includes(fromNode.type as any)) {
    return {
      isValid: false,
      reason: `Socket Constraint Rejection: Target requires node of type [${constraint.allowedNodeTypes.join(
        ', '
      )}], but source is '${fromNode.type}'`,
    };
  }

  // If node is a container, validate containerType (audio, midi, etc.)
  if (fromNode.type === 'container') {
    const cNode = fromNode as ContainerNode;
    const cType = cNode.containerType;
    if (constraint.allowedContainerTypes && !constraint.allowedContainerTypes.includes(cType as any)) {
      return {
        isValid: false,
        reason: `Socket Constraint Rejection: Target requires container of type [${constraint.allowedContainerTypes.join(
          ', '
        )}], but source is '${cType}' container`,
      };
    }

    if (cType === 'audio' && constraint.allowedAudioFormats) {
      const srcFormat = cNode.audioFormat || 'mono';
      if (!constraint.allowedAudioFormats.includes(srcFormat as any)) {
        return {
          isValid: false,
          reason: `Socket Constraint Rejection: Stereo Sampler only accepts Stereo Audio Containers (source is '${srcFormat}')`,
        };
      }
    }
  }

  return { isValid: true };
}
