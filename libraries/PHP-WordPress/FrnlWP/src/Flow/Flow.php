<?php

declare(strict_types=1);

namespace FrnlWP\Flow;

final class Flow {
    public function __construct(private string $id,private array $steps=[]) {}
    public function id(): string { return $this->id; }
    public function run(mixed $value): mixed {
        foreach($this->steps as $step) $value=$step($value);
        return $value;
    }
}