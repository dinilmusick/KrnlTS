// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. ROTARY GEOMETRY & SVG ARC PURE HELPERS
// ══════════════════════════════════════════════════════════════════════════════════════════
// @role component

export interface PolarCoordinate {
  x: number;
  y: number;
}

export function polarToCartesian(
  centerX: number,
  centerY: number,
  rad: number,
  angleInDegrees: number
): PolarCoordinate {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + rad * Math.cos(angleInRadians),
    y: centerY + rad * Math.sin(angleInRadians),
  };
}

export function describeSvgArc(
  x: number,
  y: number,
  rad: number,
  startAng: number,
  endAng: number
): string {
  const start = polarToCartesian(x, y, rad, endAng);
  const end = polarToCartesian(x, y, rad, startAng);
  const arcSweep = endAng - startAng <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', rad, rad, 0, arcSweep, 0, end.x, end.y].join(' ');
}
