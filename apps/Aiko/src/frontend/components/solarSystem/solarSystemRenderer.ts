import { SolarSystemEntity, SolarSystemGraphData } from './types.js';
import { drawNeobrutalismGlyph } from './neobrutalismGlyphs.js';

function safeRadialGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number
): CanvasGradient {
  const safeR0 = Math.max(0, Number.isFinite(r0) ? r0 : 0);
  const safeR1 = Math.max(0.01, Number.isFinite(r1) ? r1 : 0.01);
  return ctx.createRadialGradient(
    Number.isFinite(x0) ? x0 : 0,
    Number.isFinite(y0) ? y0 : 0,
    safeR0,
    Number.isFinite(x1) ? x1 : 0,
    Number.isFinite(y1) ? y1 : 0,
    safeR1
  );
}

export function renderSolarSystem({
  ctx,
  data,
  width,
  height,
  time,
  pan = { x: 0, y: 0 },
  zoom = 1,
  hoveredEntityId = null,
  selectedEntityId = null
}: {
  ctx: CanvasRenderingContext2D;
  data: SolarSystemGraphData | null;
  width: number;
  height: number;
  time: number;
  pan?: { x: number; y: number };
  zoom?: number;
  hoveredEntityId?: string | null;
  selectedEntityId?: string | null;
}): { hitMap: Array<{ entity: SolarSystemEntity; x: number; y: number; radius: number; parentScreenX?: number; parentScreenY?: number }> } {
  const hitMap: Array<{ entity: SolarSystemEntity; x: number; y: number; radius: number; parentScreenX?: number; parentScreenY?: number }> = [];

  // Guard against unmeasured zero or negative canvas sizes
  if (!width || !height || width <= 0 || height <= 0) {
    return { hitMap };
  }

  // Clear canvas
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background deep space radial gradient (centers on the pan focal point)
  const cx = width / 2;
  const cy = height / 2;
  const gradCx = cx + pan.x * 0.4;
  const gradCy = cy + pan.y * 0.4;
  const bg = safeRadialGradient(ctx, gradCx, gradCy, 10, gradCx, gradCy, Math.max(width, height) * 0.85);
  bg.addColorStop(0, '#0a101d');
  bg.addColorStop(0.5, '#050811');
  bg.addColorStop(1, '#020408');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Background stars (wrapped modulo width and height with pan offset for seamless infinite starfield)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  const starParallax = 0.5; // Starfield shifts smoothly when panning
  for (let i = 0; i < 50; i++) {
    const rawX = (i * 137.5 + pan.x * starParallax) % width;
    const rawY = (i * 269.3 + time * 0.01 + pan.y * starParallax) % height;
    const sx = rawX < 0 ? rawX + width : rawX;
    const sy = rawY < 0 ? rawY + height : rawY;
    const size = (i % 3 === 0) ? 1.6 : 1.0;
    ctx.fillRect(sx, sy, size, size);
  }

  // Random very infrequent tiny starry sparkles (twinkling cosmic specks with 0.6s duration)
  // Scaled: time * 0.16 with active window of exactly 0.60 units (0.60 seconds)
  for (let s = 0; s < 25; s++) {
    const period = 8.0;
    const tCycle = (time * 0.16 + s * 3.37) % period;
    // Active for exactly 0.6 sec
    if (tCycle < 0.6) {
      const progress = tCycle / 0.6; // 0 to 1
      const intensity = Math.sin(progress * Math.PI); // Smooth 0.6s bell curve

      const rawPx = (s * 211.7 + 73 + pan.x * starParallax) % width;
      const rawPy = (s * 337.1 + 19 + pan.y * starParallax) % height;
      const px = rawPx < 0 ? rawPx + width : rawPx;
      const py = rawPy < 0 ? rawPy + height : rawPy;

      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + intensity * 0.7})`;
      ctx.shadowColor = 'rgba(167, 232, 248, 0.9)';
      ctx.shadowBlur = 4;
      // Cross sparkle
      ctx.fillRect(px - 1, py, 3, 1);
      ctx.fillRect(px, py - 1, 1, 3);
      ctx.restore();
    }
  }

  // Very infrequent STRONG TWINKLES (super-bright diamond bursts with exactly 0.6s duration)
  // Scaled: time * 0.5 with active window of exactly 0.60 units (0.60 seconds)
  for (let st = 0; st < 6; st++) {
    const flarePeriod = 12.0;
    const tFlare = (time * 0.5 + st * 4.91) % flarePeriod;
    // Active for exactly 0.6 sec
    if (tFlare < 0.6) {
      const progress = tFlare / 0.6; // 0 to 1
      const flareIntensity = Math.sin(progress * Math.PI); // Clean 0.6s flash curve

      const rawFx = (st * 349.3 + 120 + pan.x * starParallax) % width;
      const rawFy = (st * 487.7 + 60 + pan.y * starParallax) % height;
      const fx = rawFx < 0 ? rawFx + width : rawFx;
      const fy = rawFy < 0 ? rawFy + height : rawFy;

      ctx.save();
      const flareRadius = Math.max(0.1, 3 + flareIntensity * 8);
      // Aura
      const flareGlow = safeRadialGradient(ctx, fx, fy, 0, fx, fy, flareRadius * 2.5);
      flareGlow.addColorStop(0, `rgba(255, 255, 255, ${0.85 + flareIntensity * 0.15})`);
      flareGlow.addColorStop(0.35, `rgba(147, 197, 253, ${0.6 * flareIntensity})`);
      flareGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = flareGlow;
      ctx.beginPath();
      ctx.arc(fx, fy, flareRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Sharp 4-point Diamond Star Ray
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + flareIntensity * 0.2})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(fx - flareRadius * 2.2, fy);
      ctx.lineTo(fx + flareRadius * 2.2, fy);
      ctx.moveTo(fx, fy - flareRadius * 2.2);
      ctx.lineTo(fx, fy + flareRadius * 2.2);
      ctx.stroke();

      // Core point
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Very infrequent SHOOTING STARS with luminous trailing streaks
  // Uses a long repeating cycle so shooting stars streak across the sky occasionally
  const shootingStarPeriod = 7.0; // cycle length in simulated time units
  for (let m = 0; m < 2; m++) {
    const cycleOffset = m * 3.8 + 1.2;
    const tCycle = (time * 0.15 + cycleOffset) % shootingStarPeriod;

    // Active for first 0.65 units of the 7.0 unit period (~9% of the time)
    if (tCycle < 0.65) {
      const progress = tCycle / 0.65; // 0 to 1
      const startX = ((m * 430 + 100 + pan.x * starParallax) % width + width) % width;
      const startY = ((m * 180 + 30 + pan.y * starParallax) % (height * 0.65) + (height * 0.65)) % (height * 0.65);

      const angle = Math.PI / 4 + 0.15 * (m === 0 ? 1 : -1); // diagonal downward trajectory
      const speed = Math.max(width, height) * 0.55;
      const curX = startX + Math.cos(angle) * (progress * speed);
      const curY = startY + Math.sin(angle) * (progress * speed);

      // Tail length grows then fades
      const tailLen = 95 * Math.sin(progress * Math.PI);
      const tailX = curX - Math.cos(angle) * tailLen;
      const tailY = curY - Math.sin(angle) * tailLen;

      const alpha = Math.sin(progress * Math.PI) * 0.85;

      ctx.save();
      const grad = ctx.createLinearGradient(tailX, tailY, curX, curY);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.65, `rgba(167, 243, 208, ${alpha * 0.4})`);
      grad.addColorStop(0.9, `rgba(147, 197, 253, ${alpha * 0.7})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // Bright incandescent head
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(curX, curY, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (!data?.root) {
    ctx.restore();
    return { hitMap };
  }

  // Apply Pan & Zoom
  ctx.translate(cx + pan.x, cy + pan.y);
  ctx.scale(zoom, zoom);

  const root = data.root;
  root.x = 0;
  root.y = 0;

  // Track root in hitMap
  hitMap.push({ entity: root, x: cx + pan.x, y: cy + pan.y, radius: root.radius * zoom });

  // 1. Draw Subagents orbit ring around root
  if (root.children && root.children.length > 0) {
    const orbitR = root.children[0].orbitRadius;

    // Apply repulsive separation forces among subagents on the main orbit
    applyAngularRepulsion(root.children, time, orbitR);

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    root.children.forEach((sub, sIdx) => {
      const angle = sub.orbitAngle + time * sub.orbitSpeed;
      const subX = Math.cos(angle) * orbitR;
      const subY = Math.sin(angle) * orbitR;
      sub.x = subX;
      sub.y = subY;

      // Draw tether from root to subagent
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(subX, subY);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Screen space coordinates for hit testing
      const screenSubX = cx + pan.x + subX * zoom;
      const screenSubY = cy + pan.y + subY * zoom;
      hitMap.push({
        entity: sub,
        x: screenSubX,
        y: screenSubY,
        radius: sub.radius * zoom,
        parentScreenX: cx + pan.x,
        parentScreenY: cy + pan.y
      });

      // 2. Models orbit ring around this subagent
      if (sub.children && sub.children.length > 0) {
        const mOrbitR = sub.children[0].orbitRadius;

        // Apply repulsive separation forces among sibling models
        applyAngularRepulsion(sub.children, time, mOrbitR);

        ctx.save();
        ctx.beginPath();
        ctx.arc(subX, subY, mOrbitR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();

        sub.children.forEach((mod) => {
          const mAngle = mod.orbitAngle + time * mod.orbitSpeed;
          const modX = subX + Math.cos(mAngle) * mOrbitR;
          const modY = subY + Math.sin(mAngle) * mOrbitR;
          mod.x = modX;
          mod.y = modY;

          const screenModX = cx + pan.x + modX * zoom;
          const screenModY = cy + pan.y + modY * zoom;
          hitMap.push({
            entity: mod,
            x: screenModX,
            y: screenModY,
            radius: mod.radius * zoom,
            parentScreenX: screenSubX,
            parentScreenY: screenSubY
          });

          // 3. API Keys orbit ring around model
          if (mod.children && mod.children.length > 0) {
            const kOrbitR = mod.children[0].orbitRadius;

            // Apply repulsive separation forces among sibling keys
            applyAngularRepulsion(mod.children, time, kOrbitR);

            ctx.save();
            ctx.beginPath();
            ctx.arc(modX, modY, kOrbitR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
            ctx.setLineDash([2, 4]);
            ctx.lineWidth = 0.6;
            ctx.stroke();
            ctx.restore();

            mod.children.forEach((keyNode) => {
              const kAngle = keyNode.orbitAngle + time * keyNode.orbitSpeed;
              const keyX = modX + Math.cos(kAngle) * kOrbitR;
              const keyY = modY + Math.sin(kAngle) * kOrbitR;
              keyNode.x = keyX;
              keyNode.y = keyY;

              const screenKeyX = cx + pan.x + keyX * zoom;
              const screenKeyY = cy + pan.y + keyY * zoom;
              hitMap.push({
                entity: keyNode,
                x: screenKeyX,
                y: screenKeyY,
                radius: keyNode.radius * zoom,
                parentScreenX: screenModX,
                parentScreenY: screenModY
              });

              // Render API Key sphere
              drawKeySphere(ctx, keyX, keyY, keyNode, hoveredEntityId === keyNode.id);
            });
          }

          // Render Model sphere
          drawModelSphere(ctx, modX, modY, mod, hoveredEntityId === mod.id);
        });
      }

      // Render Subagent sphere
      drawSubAgentSphere(ctx, subX, subY, sub, hoveredEntityId === sub.id);
    });
  }

  // Draw Central Agent Sphere
  drawCentralAgent(ctx, 0, 0, root, hoveredEntityId === root.id, time);

  ctx.restore();
  return { hitMap };
}

function drawCentralAgent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  entity: SolarSystemEntity,
  isHovered: boolean,
  time: number
) {
  ctx.save();
  const pulse = Math.sin(time * 0.003) * 1.5;
  const r = entity.radius + (isHovered ? 4 : pulse);

  // 1. Starry Celestial Outer Glow Aura
  const starryGlow = safeRadialGradient(ctx, x, y, Math.max(0.1, r * 0.7), x, y, Math.max(0.2, r * 2.6));
  starryGlow.addColorStop(0, 'rgba(167, 232, 248, 0.45)');
  starryGlow.addColorStop(0.5, 'rgba(167, 232, 248, 0.15)');
  starryGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = starryGlow;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.2, r * 2.6), 0, Math.PI * 2);
  ctx.fill();

  // 2. Neo-Brutalism Hard Offset Drop Shadow (no blur)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.beginPath();
  ctx.arc(x + 4, y + 4, Math.max(0.1, r), 0, Math.PI * 2);
  ctx.fill();

  // 3. Pastel Neo-Brutalist Body Fill
  ctx.fillStyle = entity.color || '#A7E8F8';
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  ctx.fill();

  // 4. Thick Inky Black Outline (Neo-Brutalism Signature)
  ctx.strokeStyle = isHovered ? '#FFFFFF' : '#000000';
  ctx.lineWidth = isHovered ? 3.5 : 3.0;
  ctx.stroke();

  // 5. Inner Subtle Rim Highlight
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r - 2.5), 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 6. Transparent PNG Tattoo Glyph on Sphere Surface
  drawNeobrutalismGlyph(ctx, x, y, entity.iconName || 'Brain', Math.max(1, r * 1.1), '#000000');

  ctx.restore();
}

function drawSubAgentSphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  entity: SolarSystemEntity,
  isHovered: boolean
) {
  ctx.save();
  const r = Math.max(2, entity.radius + (isHovered ? 3 : 0));

  // 1. Starry Ethereal Radial Glow
  const aura = safeRadialGradient(ctx, x, y, Math.max(0.1, r * 0.8), x, y, Math.max(0.2, r * 2.3));
  aura.addColorStop(0, (entity.color || '#E1BEE7') + '55');
  aura.addColorStop(0.6, (entity.color || '#E1BEE7') + '15');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.2, r * 2.3), 0, Math.PI * 2);
  ctx.fill();

  // 2. Hard Offset Neo-Brutalist Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.beginPath();
  ctx.arc(x + 3, y + 3, r, 0, Math.PI * 2);
  ctx.fill();

  // 3. Pastel Neo-Brutalism Fill
  ctx.fillStyle = entity.color || '#E1BEE7';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 4. Heavy Jet-Black Border
  ctx.strokeStyle = isHovered ? '#FFFFFF' : '#000000';
  ctx.lineWidth = isHovered ? 3.0 : 2.4;
  ctx.stroke();

  // 5. Transparent Tattoo Icon on Sphere
  drawNeobrutalismGlyph(ctx, x, y, entity.iconName || 'Cpu', Math.max(1, r * 1.15), '#000000');

  ctx.restore();
}

function drawModelSphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  entity: SolarSystemEntity,
  isHovered: boolean
) {
  ctx.save();
  const r = Math.max(2, entity.radius + (isHovered ? 2 : 0));

  // 1. Starry Radial Glow
  const aura = safeRadialGradient(ctx, x, y, Math.max(0.1, r * 0.8), x, y, Math.max(0.2, r * 2.1));
  aura.addColorStop(0, (entity.color || '#B7F0AD') + '45');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.2, r * 2.1), 0, Math.PI * 2);
  ctx.fill();

  // 2. Hard Offset Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.beginPath();
  ctx.arc(x + 2, y + 2, r, 0, Math.PI * 2);
  ctx.fill();

  // 3. Pastel Neo-Brutalist Fill
  ctx.fillStyle = entity.color || '#B7F0AD';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 4. Black Outline
  ctx.strokeStyle = isHovered ? '#FFFFFF' : '#000000';
  ctx.lineWidth = isHovered ? 2.2 : 1.8;
  ctx.stroke();

  // 5. Provider Company Transparent Tattoo Icon on Model Sphere
  drawNeobrutalismGlyph(ctx, x, y, entity.providerId || 'google', Math.max(1, r * 1.1), '#000000');

  ctx.restore();
}

function drawKeySphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  entity: SolarSystemEntity,
  isHovered: boolean
) {
  ctx.save();
  const r = Math.max(1, entity.radius + (isHovered ? 2 : 0));

  // 1. Starry Key Twinkle Glow
  const aura = safeRadialGradient(ctx, x, y, Math.max(0.1, r * 0.7), x, y, Math.max(0.2, r * 2.4));
  aura.addColorStop(0, (entity.color || '#A7F3D0') + '66');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Hard Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.arc(x + 1.5, y + 1.5, r, 0, Math.PI * 2);
  ctx.fill();

  // 3. Pastel Fill
  ctx.fillStyle = entity.color || '#A7F3D0';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 4. Crisp Black Outer Stroke
  ctx.strokeStyle = isHovered ? '#FFFFFF' : '#000000';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 5. Miniature Center Tattoo Dot
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Applies soft pairwise angular repulsion between sibling spheres on the same orbit
 * to prevent spheres of the same type from clustering or occluding each other.
 */
function applyAngularRepulsion(siblings: SolarSystemEntity[], time: number, orbitRadius: number) {
  if (siblings.length <= 1) return;

  const twoPi = Math.PI * 2;
  // Compute current instantaneous angles
  const angles = siblings.map((s) => {
    let a = (s.orbitAngle + time * s.orbitSpeed) % twoPi;
    if (a < 0) a += twoPi;
    return a;
  });

  // Calculate repulsion forces based on angular proximity
  for (let i = 0; i < siblings.length; i++) {
    for (let j = i + 1; j < siblings.length; j++) {
      let diff = angles[i] - angles[j];
      // Normalize difference to [-PI, PI]
      while (diff > Math.PI) diff -= twoPi;
      while (diff < -Math.PI) diff += twoPi;

      const combinedRadius = (siblings[i].radius + siblings[j].radius) * 1.5;
      const minAngularDist = Math.max(0.35, combinedRadius / Math.max(orbitRadius, 1));

      if (Math.abs(diff) < minAngularDist && Math.abs(diff) > 0.0001) {
        const overlap = minAngularDist - Math.abs(diff);
        const push = overlap * 0.04; // Smooth repulsion step
        const sign = diff >= 0 ? 1 : -1;

        siblings[i].orbitAngle += sign * push;
        siblings[j].orbitAngle -= sign * push;
      }
    }
  }
}

