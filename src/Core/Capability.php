<?php

declare(strict_types=1);

namespace FrnlWP\Core;
final class Capability {
    public function __construct(public readonly string $id,public readonly int $version=1,public readonly array $provides=[],public readonly array $requires=[]){}
}