<?php

declare(strict_types=1);

namespace KloksWP\Contracts;
final class ServiceContract {
    public function __construct(public readonly string $id,public readonly string $version='1.0.0',public readonly array $operations=[],public readonly array $capabilities=[]){}
}