<?php

declare(strict_types=1);

namespace FrnlWP\Core;
final class Contract {
    public function __construct(public readonly string $id,public readonly int $version=1,public readonly array $inputs=[],public readonly array $outputs=[],public readonly array $events=[],public readonly array $commands=[],public readonly array $capabilities=[]){}
    public function toArray():array{return get_object_vars($this);}
}