import { ExecutionNode, ExecutionEdge } from './executionTypes.js';
import { resolveCanvasColor } from './colorResolver.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

function getNodeStyle(node: ExecutionNode, isHovered: boolean) {
  if (node.type === 'user') return { core: '#1E293B', border: isHovered ? '#94A3B8' : '#64748B', glow: 'rgba(148, 163, 184, 0.3)' };
  if (node.type === 'agent') return { core: '#0369A1', border: isHovered ? '#38BDF8' : '#0284C7', glow: 'rgba(56, 189, 248, 0.6)' };
  if (node.type === 'enricher') return { core: '#581C87', border: isHovered ? '#C084FC' : '#7E22CE', glow: 'rgba(192, 132, 252, 0.5)' };
  if (node.type === 'router') return { core: '#7C2D12', border: isHovered ? '#FDBA74' : '#C2410C', glow: 'rgba(251, 146, 60, 0.5)' };
  if (node.type === 'tool') return { core: node.status === 'failed' ? '#7F1D1D' : '#064E3B', border: node.status === 'failed' ? 'var(--skipo-error, #e76f51)' : isHovered ? '#4ADE80' : '#059669', glow: node.status === 'failed' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(74, 222, 128, 0.5)' };
  if (node.type === 'endpoint') return { core: node.status === 'failed' ? '#7F1D1D' : '#164E63', border: node.status === 'failed' ? 'var(--skipo-error, #e76f51)' : isHovered ? '#22D3EE' : '#0891B2', glow: node.status === 'failed' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 211, 238, 0.5)' };
  if (node.type === 'zod') return { core: '#172554', border: isHovered ? '#60A5FA' : '#1D4ED8', glow: 'rgba(96, 165, 250, 0.4)' };
  if (node.type === 'executor') return { core: node.status === 'failed' ? '#7F1D1D' : '#713F12', border: node.status === 'failed' ? 'var(--skipo-error, #e76f51)' : isHovered ? '#FACC15' : '#B45309', glow: node.status === 'failed' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(250, 204, 21, 0.5)' };
  if (node.type === 'key') return { core: '#1E1B4B', border: isHovered ? '#A5B4FC' : '#4338CA', glow: 'rgba(165, 180, 252, 0.4)' };
  return { core: '#334155', border: '#64748B', glow: 'rgba(100, 116, 139, 0.2)' };
}

// ════ IMPLEMENTATION ═════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function drawExecutionGraph(
  ctx: CanvasRenderingContext2D,
  nodes: ExecutionNode[],
  edges: ExecutionEdge[],
  hoveredNode: ExecutionNode | null,
  hoveredEdge: ExecutionEdge | null,
  selectedNode: ExecutionNode | null,
  selectedEdge: ExecutionEdge | null,
  time: number
) {
  // 1. Draw Edges
  edges.forEach(edge => {
    const s = nodes.find(n => n.id === edge.source);
    const t = nodes.find(n => n.id === edge.target);
    if (!s || !t) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);

    const isSelected = selectedEdge?.id === edge.id;
    const isHovered = hoveredEdge?.id === edge.id;

    if (edge.type === 'access') {
      ctx.strokeStyle = isSelected ? '#A3E635' : isHovered ? '#84CC16' : 'rgba(163, 230, 53, 0.45)';
      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2.0 : 1.2;
      ctx.setLineDash([4, 4]);
    } else if (edge.type === 'success') {
      ctx.strokeStyle = isSelected ? '#4ADE80' : isHovered ? resolveCanvasColor('var(--skipo-success, #2a9d8f)', ctx.canvas) : 'rgba(34, 197, 94, 0.55)';
      ctx.lineWidth = isSelected ? 3.0 : isHovered ? 2.4 : 1.6;
    } else if (edge.type === 'failure') {
      ctx.strokeStyle = isSelected ? '#F87171' : isHovered ? resolveCanvasColor('var(--skipo-error, #e76f51)', ctx.canvas) : 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = isSelected ? 3.2 : isHovered ? 2.6 : 1.8;
    } else {
      ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#0EA5E9' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2.0 : 1.5;
    }

    ctx.stroke();

    if (edge.type !== 'access') {
      ctx.setLineDash([6, 12]);
      ctx.lineDashOffset = -(time * 40) % 100;
      ctx.strokeStyle = edge.type === 'success' ? resolveCanvasColor('var(--skipo-success, #2a9d8f)', ctx.canvas) : edge.type === 'failure' ? resolveCanvasColor('var(--skipo-error, #e76f51)', ctx.canvas) : '#00F0FF';
      ctx.lineWidth = (ctx.lineWidth || 1) + 0.5;
      ctx.stroke();
    }

    const midX = (s.x + t.x) / 2;
    const midY = (s.y + t.y) / 2;
    const angle = Math.atan2(t.y - s.y, t.x - s.x);
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX - 7 * Math.cos(angle - Math.PI / 6), midY - 7 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(midX - 7 * Math.cos(angle + Math.PI / 6), midY - 7 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
  });

  // 2. Draw Nodes
  nodes.forEach(node => {
    ctx.save();
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    const style = getNodeStyle(node, isHovered);

    const auraR = node.radius * (isHovered ? 2.5 : 1.8);
    const grad = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, auraR);
    grad.addColorStop(0, resolveCanvasColor(style.glow, ctx.canvas));
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(node.x, node.y, auraR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = style.core;
    ctx.strokeStyle = isSelected ? resolveCanvasColor('var(--skipo-text-primary, #ffffff)', ctx.canvas) : resolveCanvasColor(style.border, ctx.canvas);
    ctx.lineWidth = isSelected ? 3.0 : isHovered ? 2.2 : 1.5;
    ctx.shadowColor = resolveCanvasColor(style.glow, ctx.canvas);
    ctx.shadowBlur = isSelected ? 15 : isHovered ? 8 : 4;
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.strokeStyle = 'var(--skipo-text-primary, #ffffff)';
    ctx.lineWidth = 1.2;

    if (node.type === 'user') {
      ctx.arc(node.x, node.y - 2, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(node.x, node.y + 6, 5, Math.PI, 0);
      ctx.stroke();
    } else if (node.type === 'agent') {
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (node.type === 'enricher') {
      ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--skipo-text-primary, #ffffff)';
      ctx.fill();
    } else if (node.type === 'router') {
      ctx.moveTo(node.x - 4, node.y);
      ctx.lineTo(node.x + 4, node.y);
      ctx.stroke();
    } else if (node.type === 'tool') {
      ctx.rect(node.x - 3, node.y - 3, 6, 6);
      ctx.stroke();
    } else if (node.type === 'endpoint') {
      ctx.moveTo(node.x - 4, node.y - 4);
      ctx.lineTo(node.x + 4, node.y + 4);
      ctx.stroke();
    }

    ctx.restore();
  });
}
