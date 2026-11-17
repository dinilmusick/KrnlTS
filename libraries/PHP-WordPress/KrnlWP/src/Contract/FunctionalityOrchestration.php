<?php

declare(strict_types=1);

namespace KrnlWP\Contract;

interface FunctionalityOrchestration {
    public function id(): string;
    /** @return list<string> */
    public function functionalityIds(): array;
    public function execute(array $input = []): mixed;
}