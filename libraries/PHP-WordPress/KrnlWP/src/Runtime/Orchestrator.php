<?php

declare(strict_types=1);

namespace KrnlWP\Runtime;

use KrnlWP\Contract\Functionality;
use KrnlWP\Contract\FunctionalityOrchestration;
use RuntimeException;

final class Orchestrator implements FunctionalityOrchestration {
    /** @param list<Functionality> $steps */
    public function __construct(private string $name,private array $steps) {}

    public function id(): string { return $this->name; }

    public function functionalityIds(): array {
        return array_map(static fn(Functionality $f): string=>$f->id(),$this->steps);
    }

    public function execute(array $input=[]): mixed {
        $value=$input;
        foreach($this->steps as $step) {
            if (!is_array($value)) throw new RuntimeException("Orchestration input must remain an array");
            $value=$step->execute($value);
        }
        return $value;
    }
}