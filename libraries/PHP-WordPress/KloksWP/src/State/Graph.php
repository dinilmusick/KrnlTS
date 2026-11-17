<?php

declare(strict_types=1);

namespace KloksWP\State;

use Symfony\Component\Workflow\Definition;
use Symfony\Component\Workflow\Transition;
use Symfony\Component\Workflow\Workflow;

final class Graph {
    public function __construct(private Workflow $workflow) {}
    public static function from(array $states,array $transitions,string $initial): self {
        $places=array_fill_keys($states,[]);
        $workflow=new Workflow(new Definition($places,array_map(
            static fn(array $t)=>new Transition($t['id'],$t['from'],$t['to']),$transitions
        ),$initial));
        return new self($workflow);
    }
    public function can(object $subject,string $transition): bool { return $this->workflow->can($subject,$transition); }
    public function apply(object $subject,string $transition): void { $this->workflow->apply($subject,$transition); }
}