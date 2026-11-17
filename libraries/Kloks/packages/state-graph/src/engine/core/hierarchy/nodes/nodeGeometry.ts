// ═══════════════════════════════════════════════════════════════════
// NODE GEOMETRY & SOCKET CLEARANCE CALCULATOR
// ═══════════════════════════════════════════════════════════════════
import { SpaceNode } from "../../../types/index.js";

export interface NodeDimensions {
  width: number;
  height: number;
  halfWidth: number;
  halfHeight: number;
}



/**
 * Resolves exact card width and height for any SpaceNode based on its archetype.
 */
export function getNodeDimensions(node: SpaceNode): NodeDimensions {
  const isArrangement = node.type === 'arrangement';
  const isCode = node.type === 'code';
  const isTrigger = node.type === 'trigger';
  const isTriggerFractions = isTrigger && (node as any).triggerType === 'beat_fractions';
  const isRetroRecorder = node.type === 'recorder' && (node as any).recordingMode === 'retrospective';
  const isStandardRecorder = node.type === 'recorder' && !isRetroRecorder;
  const isContainer = node.type === 'container';
  const isStrip = node.type === 'input_strip' || node.type === 'output_strip';
  const isButton = node.type === 'button';
  const isString = node.type === 'primitive_string';
  const isNumber = node.type === 'primitive_number';
  const isBoolean = node.type === 'primitive_boolean';
  const isObject = node.type === 'primitive_object';
  const isFolderPath = node.type === 'folder_path';

  const width = isArrangement
    ? ((node as any).width || 600)
    : isCode
    ? ((node as any).width || 380)
    : isTriggerFractions
    ? 280
    : isTrigger
    ? 170
    : isRetroRecorder
    ? 210
    : isContainer
    ? 200
    : isFolderPath
    ? 190
    : isObject
    ? 190
    : isString
    ? 170
    : isNumber
    ? 150
    : isStandardRecorder
    ? 170
    : isStrip
    ? 155
    : isBoolean
    ? 135
    : isButton
    ? 110
    : 140;

  const height = isArrangement
    ? ((node as any).height || 300)
    : isCode
    ? ((node as any).height || 260)
    : isFolderPath
    ? 62
    : isObject
    ? 76
    : isString
    ? 60
    : isNumber
    ? 60
    : isBoolean
    ? 60
    : isTriggerFractions
    ? 116
    : isTrigger
    ? 76
    : isRetroRecorder
    ? 120
    : isContainer
    ? 120
    : isButton
    ? 110
    : 70;

  return {
    width,
    height,
    halfWidth: width / 2,
    halfHeight: height / 2,
  };
}

/**
 * Calculates socket local offset enforcing that the handle always appears just outside the node body on spawn,
 * and constrains any custom nudge displacement so the handle cannot be pushed into the node body area at all.
 */
export function calculateConstrainedSocketOffset(
  node: SpaceNode,
  socketId: string,
  isOutput: boolean,
  index: number,
  totalSockets: number,
  clearance: number = 14
): { x: number; y: number } {
  const customOffsets = node.socketOffsets;
  const rawNudge = customOffsets?.[socketId] || { x: 0, y: 0 };
  return constrainSocketOffset(node, socketId, isOutput, index, totalSockets, rawNudge, clearance);
}

export function constrainSocketOffset(
  node: SpaceNode,
  socketId: string,
  isOutput: boolean,
  index: number,
  totalSockets: number,
  rawNudge: { x: number; y: number },
  clearance: number = 14
): { x: number; y: number } {
  const dims = getNodeDimensions(node);
  const count = Math.max(1, totalSockets);
  const isCustomBox = node.type === 'arrangement' || node.type === 'code';
  const availableHeight = isCustomBox ? Math.max(100, dims.height - 70) : 0;
  const socketPitch = isCustomBox ? Math.min(42, availableHeight / count) : 40;
  const totalSpan = (count - 1) * socketPitch;
  const baseY = count === 1 ? (isCustomBox ? 14 : 10) : -totalSpan / 2 + index * socketPitch + (isCustomBox ? 14 : 10);

  const effectiveClearance = Math.max(12, clearance);
  const baseX = isOutput ? dims.halfWidth + effectiveClearance : -dims.halfWidth - effectiveClearance;

  const targetX = baseX + rawNudge.x;
  const targetY = baseY + rawNudge.y;

  const minMargin = 4;
  const bodyLeft = -dims.halfWidth;
  const bodyRight = dims.halfWidth;
  const bodyTop = -dims.halfHeight;
  const bodyBottom = dims.halfHeight;

  let finalTargetX = targetX;
  let finalTargetY = targetY;

  if (
    targetX > bodyLeft - minMargin &&
    targetX < bodyRight + minMargin &&
    targetY > bodyTop - minMargin &&
    targetY < bodyBottom + minMargin
  ) {
    if (isOutput) {
      finalTargetX = bodyRight + Math.max(minMargin, effectiveClearance / 2);
    } else {
      finalTargetX = bodyLeft - Math.max(minMargin, effectiveClearance / 2);
    }
  }

  return {
    x: finalTargetX - baseX,
    y: finalTargetY - baseY,
  };
}

export const constrainSocketNudge = constrainSocketOffset;
