<?php

declare(strict_types=1);

namespace KloksWP\Orchestrations;
final class Orchestrator {
    public function run(array $steps,mixed $value=null):mixed{foreach($steps as $step){if(!is_callable($step))throw new \InvalidArgumentException('Orchestration step must be callable');$value=$step($value);}return $value;}
}