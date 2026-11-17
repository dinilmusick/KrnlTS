import { StarNode, drawTargetReticle } from '../galaxyRenderer.js';
import { resolveCanvasColor } from '../galaxy/colorResolver.js';

export function drawForceLinks(
  ctx: CanvasRenderingContext2D,
  nodes: StarNode[],
  cx: number,
  cy: number,
  time: number
) {
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(cx, cy);

    if (node.isActiveInFlight) {
      ctx.strokeStyle = resolveCanvasColor('var(--skipo-success, #2a9d8f)', ctx.canvas);
      ctx.lineWidth = 2.5 + Math.sin(time * 0.01) * 1.5;
      ctx.shadowColor = resolveCanvasColor('var(--skipo-success, #2a9d8f)', ctx.canvas);
      ctx.shadowBlur = 14;
    } else if (node.isNext) {
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#F97316';
      ctx.shadowBlur = 8;
    } else if (node.isHighlighted) {
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 10;
    } else if (node.isFailed) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  });
}
