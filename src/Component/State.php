<?php

declare(strict_types=1);

namespace FrnlWP\Component;

final class State {
    public function __construct(public readonly string $id,public readonly array $visual=[]) {}
}