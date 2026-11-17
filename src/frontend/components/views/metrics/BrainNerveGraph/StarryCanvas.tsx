import React, { useEffect, useRef } from 'react';
import { resolveCanvasColor } from '../../../chat/galaxy/colorResolver.js';

// ════ STARRYCANVAS IMPLEMENTATION ═════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const StarryCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = canvas.offsetWidth || 800;
    let height = canvas.height = canvas.offsetHeight || 380;

    const stars: Array<{ x: number; y: number; size: number; speed: number; opacity: number }> = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.15 + 0.05,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = canvas.width = entry.contentRect.width || 800;
        height = canvas.height = entry.contentRect.height || 380;
      }
    });
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = resolveCanvasColor('var(--skipo-bg, #0f172a)', canvas);
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        if (star.x > width) star.x = Math.random() * width;
        if (star.y > height) star.y = Math.random() * height;
        ctx.fillStyle = resolveCanvasColor('var(--skipo-warning, rgba(234, 179, 8, 0.45))', canvas);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />;
};
