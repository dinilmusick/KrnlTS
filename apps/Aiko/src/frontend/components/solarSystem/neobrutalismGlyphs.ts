export function drawNeobrutalismGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  glyphName: string | undefined,
  size: number,
  color: string = '#000000'
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const s = size / 24; // standard 24x24 viewBox scale
  ctx.scale(s, s);

  switch (glyphName?.toLowerCase()) {
    case 'brain': {
      // Brain icon tattoo paths
      ctx.beginPath();
      ctx.arc(-5, -4, 5, Math.PI * 0.5, Math.PI * 1.8);
      ctx.arc(-5, 4, 5, Math.PI * 1.2, Math.PI * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(5, -4, 5, Math.PI * 1.2, Math.PI * 0.5);
      ctx.arc(5, 4, 5, Math.PI * 0.5, Math.PI * 1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 9);
      ctx.stroke();
      break;
    }

    case 'cpu': {
      // CPU square chip with pins
      ctx.strokeRect(-7, -7, 14, 14);
      ctx.strokeRect(-3, -3, 6, 6);
      // Pins
      [-4, 0, 4].forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p, -7); ctx.lineTo(p, -10);
        ctx.moveTo(p, 7); ctx.lineTo(p, 10);
        ctx.moveTo(-7, p); ctx.lineTo(-10, p);
        ctx.moveTo(7, p); ctx.lineTo(10, p);
        ctx.stroke();
      });
      break;
    }

    case 'sparkles': {
      // 4-point star sparkles
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(0, 0, 10, 0);
      ctx.quadraticCurveTo(0, 0, 0, 10);
      ctx.quadraticCurveTo(0, 0, -10, 0);
      ctx.quadraticCurveTo(0, 0, 0, -10);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'wrench': {
      // Wrench tool icon
      ctx.beginPath();
      ctx.arc(-4, -4, 5, 0.4, Math.PI * 1.8);
      ctx.lineTo(6, 6);
      ctx.arc(7, 7, 2, 0, Math.PI * 2);
      ctx.lineTo(-2, -2);
      ctx.stroke();
      break;
    }

    case 'terminal': {
      // Command terminal prompt `>_`
      ctx.strokeRect(-9, -7, 18, 14);
      ctx.beginPath();
      ctx.moveTo(-5, -3);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 3);
      ctx.moveTo(0, 3);
      ctx.lineTo(5, 3);
      ctx.stroke();
      break;
    }

    case 'shield': {
      // Shield outline with inner chevron
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, -6);
      ctx.lineTo(7, 1);
      ctx.quadraticCurveTo(7, 8, 0, 10);
      ctx.quadraticCurveTo(-7, 8, -7, 1);
      ctx.lineTo(-7, -6);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(0, 6);
      ctx.stroke();
      break;
    }

    case 'zap': {
      // High-voltage lightning bolt
      ctx.beginPath();
      ctx.moveTo(2, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(-2, 10);
      ctx.lineTo(6, -1);
      ctx.lineTo(0, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'gitfork': {
      // Git fork node
      ctx.beginPath();
      ctx.arc(-5, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(0, 6, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, -3.5);
      ctx.lineTo(-5, -1);
      ctx.quadraticCurveTo(-5, 3, 0, 3.5);
      ctx.moveTo(5, -3.5);
      ctx.lineTo(5, -1);
      ctx.quadraticCurveTo(5, 3, 0, 3.5);
      ctx.lineTo(0, 3.5);
      ctx.stroke();
      break;
    }

    case 'google': {
      // Google "G" / Spark emblem
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0.4, Math.PI * 1.8);
      ctx.lineTo(0, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();
      break;
    }

    case 'groq': {
      // Groq geometric 'Q' circle with diagonal jet
      ctx.beginPath();
      ctx.arc(0, -1, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(7, 7);
      ctx.stroke();
      break;
    }

    case 'cerebras': {
      // Cerebras brain-circuit wafer / diamond
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeRect(-2, -2, 4, 4);
      break;
    }

    case 'openrouter': {
      // OpenRouter directional router node
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      [-7, 7].forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p, 0); ctx.lineTo(0, 0);
        ctx.moveTo(0, p); ctx.lineTo(0, 0);
        ctx.stroke();
      });
      break;
    }

    case 'together': {
      // Together AI twin interlocking circles
      ctx.beginPath();
      ctx.arc(-3, 0, 4.5, 0, Math.PI * 2);
      ctx.arc(3, 0, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'nvidia': {
      // NVIDIA eye/claw arc
      ctx.beginPath();
      ctx.arc(0, 0, 7, Math.PI * 0.7, Math.PI * 2.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, Math.PI * 0.7, Math.PI * 2.3);
      ctx.stroke();
      break;
    }

    case 'huggingface': {
      // HuggingFace smiley arc & hands
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1, 3.5, 0.2, Math.PI - 0.2);
      ctx.stroke();
      break;
    }

    case 'anthropic': {
      // Anthropic 'A' stylized delta
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 6);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3, 1);
      ctx.lineTo(3, 1);
      ctx.stroke();
      break;
    }

    case 'openai': {
      // OpenAI flower rosette knot
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'mistral': {
      // Mistral staircase / block wind
      ctx.strokeRect(-6, -6, 4, 4);
      ctx.strokeRect(-1, -1, 4, 4);
      ctx.strokeRect(4, 4, 4, 4);
      break;
    }

    default: {
      // Clean geometric tattoo seal
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
      ctx.moveTo(0, -4); ctx.lineTo(0, 4);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}
