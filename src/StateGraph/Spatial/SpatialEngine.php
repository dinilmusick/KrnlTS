<?php

declare(strict_types=1);

namespace KloksWP\StateGraph\Spatial;

/**
 * 2D spatial calculations, zoom/pan transforms, and collision testing.
 */
class SpatialEngine
{
    private float $zoom = 1.0;
    private float $panX = 0.0;
    private float $panY = 0.0;

    public function setViewport(float $panX, float $panY, float $zoom): void
    {
        $this->panX = $panX;
        $this->panY = $panY;
        $this->zoom = max(0.1, min(5.0, $zoom));
    }

    public function screenToWorld(float $screenX, float $screenY): array
    {
        return [
            'x' => ($screenX - $this->panX) / $this->zoom,
            'y' => ($screenY - $this->panY) / $this->zoom,
        ];
    }

    public function worldToScreen(float $worldX, float $worldY): array
    {
        return [
            'x' => ($worldX * $this->zoom) + $this->panX,
            'y' => ($worldY * $this->zoom) + $this->panY,
        ];
    }

    public function intersects(array $rectA, array $rectB): bool
    {
        return !(
            $rectA['x'] + $rectA['width'] < $rectB['x'] ||
            $rectB['x'] + $rectB['width'] < $rectA['x'] ||
            $rectA['y'] + $rectA['height'] < $rectB['y'] ||
            $rectB['y'] + $rectB['height'] < $rectA['y']
        );
    }
}
