import { StarNode, SubNode } from './galaxyRenderer.js';
import { resolveCanvasColor } from './galaxy/colorResolver.js';

export function drawSubNodeTethers(
  ctx: CanvasRenderingContext2D,
  node: StarNode,
  time: number
) {
  if (!node || !node.subNodes || node.subNodes.length === 0 || !Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

  ctx.save();
  node.subNodes.forEach((sub) => {
    if (!sub || !Number.isFinite(sub.x) || !Number.isFinite(sub.y)) return;
    const orbitDist = Number.isFinite(sub.orbitDist) ? sub.orbitDist : 32;
    const orbitAngle = Number.isFinite(sub.orbitAngle) ? sub.orbitAngle : 0.78;

    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(sub.x, sub.y);

    const pulseAlpha = 0.4 + Math.sin(time * 0.005 + orbitAngle) * 0.25;
    ctx.strokeStyle = `rgba(239, 68, 68, ${Number.isFinite(pulseAlpha) ? pulseAlpha : 0.5})`;
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1.5;
    ctx.shadowColor = resolveCanvasColor('var(--skipo-error, #e76f51)', ctx.canvas);
    ctx.shadowBlur = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(node.x, node.y, Math.max(0, orbitDist), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.setLineDash([2, 6]);
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  ctx.restore();
}

export function drawSubNodeGeometry(
  ctx: CanvasRenderingContext2D,
  sub: SubNode,
  time: number
) {
  if (!sub || !Number.isFinite(sub.x) || !Number.isFinite(sub.y)) return;
  ctx.save();
  const isHovered = Boolean(sub.isHovered);
  const orbitAngle = Number.isFinite(sub.orbitAngle) ? sub.orbitAngle : 0.78;
  const baseRadius = Number.isFinite(sub.radius) ? sub.radius : 8;
  const pulse = Math.sin(time * 0.008 + orbitAngle) * 1.5;
  const currentRadius = Math.max(1, baseRadius + (isHovered ? 3 : (Number.isFinite(pulse) ? pulse * 0.5 : 0)));

  const glowR = Math.max(1, currentRadius * (isHovered ? 2.5 : 1.8));

  const aura = ctx.createRadialGradient(sub.x, sub.y, 1, sub.x, sub.y, glowR);
  aura.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
  aura.addColorStop(0.5, 'rgba(185, 28, 28, 0.4)');
  aura.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.arc(sub.x, sub.y, glowR, 0, Math.PI * 2);
  ctx.fillStyle = aura;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(sub.x, sub.y, currentRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#7F1D1D';
  ctx.strokeStyle = sub.isSelected ? resolveCanvasColor('var(--skipo-error, #e76f51)', ctx.canvas) : isHovered ? '#FCA5A5' : resolveCanvasColor('var(--skipo-error, #e76f51)', ctx.canvas);
  ctx.lineWidth = sub.isSelected ? 2.5 : isHovered ? 2.2 : 1.6;
  ctx.shadowColor = resolveCanvasColor('var(--skipo-error, #e76f51)', ctx.canvas);
  ctx.shadowBlur = sub.isSelected ? 16 : isHovered ? 12 : 6;
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  const count = sub.totalFailedCount || (sub.allFailures ? sub.allFailures.length : 1);
  if (count > 1) {
    ctx.font = '900 8.5px monospace';
    ctx.fillStyle = '#FEE2E2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${count}!`, sub.x, sub.y);
  } else {
    ctx.beginPath();
    const crossSize = currentRadius * 0.45;
    ctx.moveTo(sub.x - crossSize, sub.y - crossSize);
    ctx.lineTo(sub.x + crossSize, sub.y + crossSize);
    ctx.moveTo(sub.x + crossSize, sub.y - crossSize);
    ctx.lineTo(sub.x - crossSize, sub.y + crossSize);
    ctx.strokeStyle = '#FEE2E2';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  const tickAngle = (time * 0.003 + orbitAngle) % (Math.PI * 2);
  const tickX = sub.x + Math.cos(tickAngle) * (currentRadius + 4);
  const tickY = sub.y + Math.sin(tickAngle) * (currentRadius + 4);
  if (Number.isFinite(tickX) && Number.isFinite(tickY)) {
    ctx.beginPath();
    ctx.arc(tickX, tickY, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#F87171';
    ctx.fill();
  }

  ctx.font = 'bold 8.5px monospace';
  ctx.fillStyle = isHovered ? '#FEE2E2' : '#FCA5A5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const modelIdStr = typeof sub.modelId === 'string' ? sub.modelId : 'FAULTED';
  const labelText = count > 1 ? `▲ ${count} ERRORS` : (modelIdStr.length > 14 ? modelIdStr.slice(0, 12) + '..' : modelIdStr);
  ctx.fillText(labelText, sub.x, sub.y + currentRadius + 10);

  ctx.font = 'bold 7.5px monospace';
  ctx.fillStyle = '#F87171';
  const penalty = Number.isFinite(sub.penaltyPercent) ? sub.penaltyPercent : 0;
  ctx.fillText(`-${penalty}% max`, sub.x, sub.y + currentRadius + 19);

  ctx.restore();
}
