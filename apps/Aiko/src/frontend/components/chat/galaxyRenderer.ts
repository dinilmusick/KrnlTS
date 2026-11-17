/**
// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

 * ASCII Architecture Flowchart: galaxyRenderer
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize galaxyRenderer     │
 *   └──────────────────────────────────┘
 */

import { ProviderId } from '../../types/app.js';
import type { StarNode, SubNode, Particle } from './galaxy/types.js';
import { resolveCanvasColor } from './galaxy/colorResolver.js';

export type { StarNode, SubNode, Particle };


// ════ GALAXYRENDERER IMPLEMENTATION ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const PROVIDER_COLORS: Record<ProviderId, string> = {
  google: '#00F0FF',
  groq: '#FF9900',
  cerebras: '#A855F7',
  openrouter: 'var(--skipo-success, #2a9d8f)',
  together: '#EC4899',
  nvidia: '#84CC16',
  huggingface: 'var(--skipo-warning, #f59e0b)',
  anthropic: 'var(--skipo-warning, #f59e0b)',
  openai: 'var(--skipo-success, #2a9d8f)',
  mistral: '#EA580C',
  local: '#06B6D4'
};

export function drawGalaxyBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stars: Array<{ x: number; y: number; size: number; speed?: number; opacity?: number }>
) {
  const cx = width / 2;
  const cy = height / 2;

  const bgGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.7);
  bgGlow.addColorStop(0, 'rgba(15, 23, 42, 0.96)');
  bgGlow.addColorStop(0.5, 'rgba(8, 14, 28, 0.98)');
  bgGlow.addColorStop(1, 'rgba(2, 6, 23, 1)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  stars.forEach((star) => {
    const opacity = star.opacity ?? 0.8;
    const speed = star.speed ?? 0.2;
    ctx.fillStyle = `rgba(0, 240, 255, ${opacity * 0.4})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();

    star.y += speed;
    if (star.y > height) {
      star.y = 0;
      star.x = Math.random() * width;
    }
  });

  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1;
  [85, 125, 165].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

export function drawCentralCore(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  selectedModelOrTime: string | number = 'CORE',
  timeParam?: number
) {
  let selectedModel = 'CORE';
  let time = 0;
  if (typeof selectedModelOrTime === 'number') {
    time = selectedModelOrTime;
    selectedModel = typeof timeParam === 'string' ? timeParam : 'CORE';
  } else {
    selectedModel = selectedModelOrTime || 'CORE';
    time = typeof timeParam === 'number' ? timeParam : 0;
  }

  ctx.save();
  const pulse = 14 + Math.sin(time * 0.004) * 2.5;

  const coreGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
  coreGlow.addColorStop(0, resolveCanvasColor('var(--skipo-text-primary, #ffffff)', ctx.canvas));
  coreGlow.addColorStop(0.3, '#38BDF8');
  coreGlow.addColorStop(0.7, 'rgba(56, 189, 248, 0.35)');
  coreGlow.addColorStop(1, 'transparent');

  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
  ctx.fillStyle = '#0284C7';
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#38BDF8';
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Core remains visually text-free per rule. All labels are shown in Bottom Bar.
  ctx.restore();
}

export function drawTargetReticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string = '#38BDF8',
  time: number = 0
) {
  ctx.save();
  const reticleR = radius + 10 + Math.sin(time * 0.006) * 2;
  const bracketLen = 6;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(x - reticleR, y - reticleR + bracketLen);
  ctx.lineTo(x - reticleR, y - reticleR);
  ctx.lineTo(x - reticleR + bracketLen, y - reticleR);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + reticleR - bracketLen, y - reticleR);
  ctx.lineTo(x + reticleR, y - reticleR);
  ctx.lineTo(x + reticleR, y - reticleR + bracketLen);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - reticleR, y + reticleR - bracketLen);
  ctx.lineTo(x - reticleR, y + reticleR);
  ctx.lineTo(x - reticleR + bracketLen, y + reticleR);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + reticleR - bracketLen, y + reticleR);
  ctx.lineTo(x + reticleR, y + reticleR);
  ctx.lineTo(x + reticleR, y + reticleR - bracketLen);
  ctx.stroke();

  ctx.restore();
}