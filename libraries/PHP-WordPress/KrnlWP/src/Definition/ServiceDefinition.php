<?php

declare(strict_types=1);

namespace KrnlWP\Definition;

use Symfony\Component\Validator\Constraints as Assert;

final class ServiceDefinition {
    public function __construct(
        #[Assert\NotBlank] public readonly string $id,
        #[Assert\NotBlank] public readonly string $version,
        /** @var list<string> */
        public readonly array $operations=[],
    ) {}
}