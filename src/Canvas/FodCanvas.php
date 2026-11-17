<?php

declare(strict_types=1);

namespace FloksWP\Canvas;

/**
 * FOD Canvas container rendering interactive node graph pipelines.
 */
class FodCanvas
{
    private string $id;
    private array $nodes;
    private array $wires;

    public function __construct(string $id = 'fod-canvas-1', array $nodes = [], array $wires = [])
    {
        $this->id = $id;
        $this->nodes = $nodes;
        $this->wires = $wires;
    }

    public function render(): string
    {
        $payload = htmlspecialchars((string)json_encode([
            'nodes' => $this->nodes,
            'wires' => $this->wires,
        ]), ENT_QUOTES, 'UTF-8');

        return sprintf(
            '<div id="%s" class="floks-fod-canvas" data-flow="%s"><div class="floks-canvas-viewport"></div><div class="floks-canvas-dock"></div></div>',
            htmlspecialchars($this->id, ENT_QUOTES, 'UTF-8'),
            $payload
        );
    }
}
