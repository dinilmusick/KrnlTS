<?php

declare(strict_types=1);

namespace FloksWP\Contracts;
final class ComponentContract {
    public function __construct(public readonly string $id,public readonly array $states=['idle'],public readonly array $visualParameters=[],public readonly array $events=[]){}
}