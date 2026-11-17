import { StarNode, drawTargetReticle } from '../galaxyRenderer.js';
import { drawForceLinks } from './helpers.js';
import { resolveCanvasColor } from '../galaxy/colorResolver.js';

export { drawForceLinks };

export function drawStarGeometry(
  ctx: CanvasRenderingContext2D,
  node: StarNode,
  time: number
) {
  ctx.save();
  const isHovered = node.isHovered;

  let starColor = resolveCanvasColor(node.baseColor, ctx.canvas);
  let dynamicRadius = node.radius;
  let glowColor = resolveCanvasColor(node.baseColor, ctx.canvas);
  let labelTag = '';
  let labelColor = '#CBD5E1';

  if (node.isActiveInFlight) {
    starColor = resolveCanvasColor('var(--skipo-success, #2a9d8f)', ctx.canvas);
    glowColor = resolveCanvasColor('var(--skipo-success, #2a9d8f)', ctx.canvas);
    dynamicRadius = 14 + Math.sin(time * 0.012) * 3.5;
    labelTag = '⚡ IN USE (ACTIVE PROMPT)';
    labelColor = '#4ADE80';

    const shockR = dynamicRadius + ((time % 1200) / 1200) * 28;
    const shockAlpha = 1 - (time % 1200) / 1200;
    ctx.beginPath();
    ctx.arc(node.x, node.y, shockR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(34, 197, 94, ${shockAlpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (node.isNext) {
    starColor = '#F97316';
    glowColor = '#F97316';
    dynamicRadius = 12 + Math.sin(time * 0.006) * 2;
    labelTag = node.isFailed ? '▶ NEXT TRY [QUEUED]' : '▶ NEXT PROMPT KEY';
    labelColor = '#FB923C';

    const rot = (time * 0.002) % (Math.PI * 2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, dynamicRadius + 8, rot, rot + Math.PI * 1.5);
    ctx.strokeStyle = '#F97316';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#F97316';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  } else if (node.isFailed) {
    starColor = resolveCanvasColor('var(--skipo-error, #e76f51)', ctx.canvas);
    glowColor = resolveCanvasColor('var(--skipo-error, #e76f51)', ctx.canvas);
    dynamicRadius = 10;
    labelTag = '✕ RATE-LIMITED / FAILED';
    labelColor = '#F87171';
  } else if (node.isPermanent) {
    labelTag = '🔒 PERMANENT KEY';
    labelColor = '#FBBF24';
  }

  if (node.isPermanent && !node.isActiveInFlight) {
    const permRot = -(time * 0.001) % (Math.PI * 2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, dynamicRadius + 6, permRot, permRot + Math.PI * 2);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = resolveCanvasColor('var(--skipo-warning, #f59e0b)', ctx.canvas);
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();
  }

  if (node.glowProgress > 0 && !node.isActiveInFlight && !node.isNext) {
    const fadeGlow = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, dynamicRadius * 2);
    fadeGlow.addColorStop(0, `rgba(34, 197, 94, ${node.glowProgress * 0.6})`);
    fadeGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = fadeGlow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, dynamicRadius * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const auraR = dynamicRadius * (node.isActiveInFlight ? 2.8 : node.isNext ? 2.3 : isHovered ? 2.0 : 1.5);
  const aura = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, auraR);
  aura.addColorStop(0, glowColor);
  aura.addColorStop(0.5, glowColor + '77');
  aura.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.arc(node.x, node.y, auraR, 0, Math.PI * 2);
  ctx.fillStyle = aura;
  ctx.fill();

  ctx.beginPath();
  const points = 5;
  const outerR = dynamicRadius;
  const innerR = outerR * 0.45;

  for (let p = 0; p < points * 2; p++) {
    const r = p % 2 === 0 ? outerR : innerR;
    const a = (p / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const sx = node.x + Math.cos(a) * r;
    const sy = node.y + Math.sin(a) * r;
    if (p === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();

  ctx.fillStyle = node.isActiveInFlight ? '#F0FDF4' : node.isNext ? '#FFF7ED' : starColor;
  ctx.strokeStyle = resolveCanvasColor('var(--skipo-text-primary, #ffffff)', ctx.canvas);
  ctx.lineWidth = node.isActiveInFlight || node.isNext ? 2 : 1;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = node.isActiveInFlight ? 20 : node.isNext ? 14 : isHovered ? 10 : 5;
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Star nodes remain visually text-free per rule. All labels are handled by Bottom Bar.
  if (node.isHighlighted) {
    drawTargetReticle(ctx, node.x, node.y, dynamicRadius, '#00F0FF', time);
  } else if (node.isSelected) {
    drawTargetReticle(ctx, node.x, node.y, dynamicRadius + 2, '#38BDF8', time);
  }

  ctx.restore();
}
